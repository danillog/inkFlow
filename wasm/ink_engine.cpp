#include <vector>
#include <cmath>
#include <algorithm>
#include <emscripten/bind.h>

struct Point {
    double x;
    double y;
    double pressure;
};

double solve_catmull_rom(double p0, double p1, double p2, double p3, double t) {
    return 0.5 * ((2.0 * p1) +
                  (-p0 + p2) * t +
                  (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t * t +
                  (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * t * t * t);
}

std::vector<Point> process_stroke(const std::vector<Point>& raw_points) {
    if (raw_points.empty()) {
        return {};
    }

    std::vector<Point> filtered_points;
    filtered_points.reserve(raw_points.size());
    filtered_points.push_back(raw_points.front());

    const double min_dist_sq = 4.0; 

    for (size_t i = 1; i < raw_points.size(); ++i) {
        double dx = raw_points[i].x - filtered_points.back().x;
        double dy = raw_points[i].y - filtered_points.back().y;
        if ((dx * dx + dy * dy) > min_dist_sq) {
            filtered_points.push_back(raw_points[i]);
        }
    }

    if (filtered_points.back().x != raw_points.back().x || 
        filtered_points.back().y != raw_points.back().y) {
        filtered_points.push_back(raw_points.back());
    }

    if (filtered_points.size() < 3) {
        return filtered_points;
    }

    std::vector<Point> smoothed_points;
    smoothed_points.reserve(filtered_points.size() * 10);

    const int steps = 8; 

    for (size_t i = 0; i < filtered_points.size() - 1; ++i) {
        Point p0 = (i == 0) ? filtered_points[i] : filtered_points[i - 1];
        Point p1 = filtered_points[i];
        Point p2 = filtered_points[i + 1];
        Point p3 = (i + 2 < filtered_points.size()) ? filtered_points[i + 2] : p2;

        for (int t_step = 0; t_step < steps; ++t_step) {
            double t = (double)t_step / steps;
            Point new_point;
            new_point.x = solve_catmull_rom(p0.x, p1.x, p2.x, p3.x, t);
            new_point.y = solve_catmull_rom(p0.y, p1.y, p2.y, p3.y, t);
            
            double dist = std::sqrt(std::pow(p2.x - p1.x, 2) + std::pow(p2.y - p1.y, 2));
            double velocity_factor = std::max(0.0, 1.0 - (dist / 50.0)); 
            
            double base_pressure = solve_catmull_rom(p0.pressure, p1.pressure, p2.pressure, p3.pressure, t);
            
            new_point.pressure = base_pressure * (0.5 + 0.5 * velocity_factor);
            new_point.pressure = std::max(0.1, std::min(new_point.pressure, 1.0));

            smoothed_points.push_back(new_point);
        }
    }

    smoothed_points.push_back(filtered_points.back());

    return smoothed_points;
}

EMSCRIPTEN_BINDINGS(ink_engine_module) {
    emscripten::value_object<Point>("Point")
        .field("x", &Point::x)
        .field("y", &Point::y)
        .field("pressure", &Point::pressure);

    emscripten::function("process_stroke", &process_stroke);
    emscripten::register_vector<Point>("VectorPoint");
}
