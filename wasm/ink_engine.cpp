#include <vector>
#include <emscripten/bind.h>

struct Point {
    double x;
    double y;
    double pressure;
};

std::vector<Point> process_stroke(const std::vector<Point>& raw_points) {
    // TODO: Implement actual smoothing algorithm (e.g., Catmull-Rom, Bézier)
    // For now, it just returns the raw points.
    return raw_points;
}

EMSCRIPTEN_BINDINGS(ink_engine_module) {
    emscripten::value_object<Point>("Point")
        .field("x", &Point::x)
        .field("y", &Point::y)
        .field("pressure", &Point::pressure);

    emscripten::function("process_stroke", &process_stroke);
    emscripten::register_vector<Point>("VectorPoint");
}
