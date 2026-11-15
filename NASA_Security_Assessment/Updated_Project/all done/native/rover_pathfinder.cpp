#include <algorithm>
#include <cmath>
#include <cstdint>
#include <fstream>
#include <iostream>
#include <limits>
#include <queue>
#include <set>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

#include <nlohmann/json.hpp>

namespace {

using json = nlohmann::json;
constexpr int kMaxPaths = 3;
constexpr std::int64_t kMaxGridCells = 1'000'000;

struct Route {
  std::vector<int> nodes;
  double cost = 0.0;
};

struct QueueItem {
  double priority;
  double pathCost;
  int node;
};

struct QueueItemGreater {
  bool operator()(const QueueItem &a, const QueueItem &b) const {
    if (a.priority != b.priority) return a.priority > b.priority;
    if (a.pathCost != b.pathCost) return a.pathCost < b.pathCost;
    return a.node > b.node;
  }
};

struct RouteGreater {
  bool operator()(const Route &a, const Route &b) const {
    if (a.cost != b.cost) return a.cost > b.cost;
    return a.nodes > b.nodes;
  }
};

struct Coordinate {
  int x;
  int y;
};

int readInteger(const json &value, const std::string &description) {
  if (!value.is_number_integer() && !value.is_number_unsigned()) {
    throw std::runtime_error(description + " يجب أن يكون عددًا صحيحًا.");
  }

  if (value.is_number_unsigned()) {
    const auto number = value.get<std::uint64_t>();
    if (number > static_cast<std::uint64_t>(std::numeric_limits<int>::max())) {
      throw std::runtime_error(description + " خارج النطاق المدعوم.");
    }
    return static_cast<int>(number);
  }

  const auto number = value.get<std::int64_t>();
  if (number < std::numeric_limits<int>::min() ||
      number > std::numeric_limits<int>::max()) {
    throw std::runtime_error(description + " خارج النطاق المدعوم.");
  }
  return static_cast<int>(number);
}

Coordinate readCoordinate(const json &document, const std::string &key) {
  if (!document.contains(key) || !document.at(key).is_object()) {
    throw std::runtime_error("الحقل '" + key + "' يجب أن يكون كائنًا يحتوي x و y.");
  }
  const auto &value = document.at(key);
  if (!value.contains("x") || !value.contains("y")) {
    throw std::runtime_error("الحقل '" + key + "' يجب أن يحتوي x و y.");
  }
  return {readInteger(value.at("x"), key + ".x"),
          readInteger(value.at("y"), key + ".y")};
}

int toNodeId(int x, int y, int width) { return y * width + x; }

std::pair<int, int> fromNodeId(int id, int width) {
  return {id % width, id / width};
}

bool hasPrefix(const std::vector<int> &path, const std::vector<int> &prefix) {
  return path.size() >= prefix.size() &&
         std::equal(prefix.begin(), prefix.end(), path.begin());
}

// Reverse Dijkstra on the intact grid. For a forward edge predecessor ->
// current, the edge cost is grid[current], so reverse relaxation pays the
// current node's value rather than the predecessor's value. Negative cells
// are obstacles and are excluded from the reverse graph.
std::vector<double> reverseDistancesToTarget(
    const std::vector<std::vector<double>> &grid, int width, int height,
    int target) {
  const int nodeCount = width * height;
  const double infinity = std::numeric_limits<double>::infinity();
  std::vector<double> distance(nodeCount, infinity);
  std::priority_queue<QueueItem, std::vector<QueueItem>, QueueItemGreater>
      open;

  distance[target] = 0.0;
  open.push({0.0, 0.0, target});

  const int dx[4] = {0, 0, -1, 1};
  const int dy[4] = {-1, 1, 0, 0};

  while (!open.empty()) {
    const QueueItem current = open.top();
    open.pop();
    if (current.pathCost != distance[current.node]) continue;

    const auto [x, y] = fromNodeId(current.node, width);
    if (grid[y][x] < 0.0) continue;
    for (int direction = 0; direction < 4; ++direction) {
      const int px = x + dx[direction];
      const int py = y + dy[direction];
      if (px < 0 || px >= width || py < 0 || py >= height) continue;

      const int predecessor = toNodeId(px, py, width);
      if (grid[py][px] < 0.0) continue;
      const double predecessorDistance = current.pathCost + grid[y][x];
      if (predecessorDistance < distance[predecessor]) {
        distance[predecessor] = predecessorDistance;
        open.push({predecessorDistance, predecessorDistance, predecessor});
      }
    }
  }
  return distance;
}

// A* on the grid after removing banned nodes/edges. The heuristic is the
// original-grid distance to target, so bans can only make it more optimistic.
// The cost of the starting cell is excluded; each move pays the cost of the
// cell entered. Every negative grid value is treated as an obstacle.
bool shortestPath(const std::vector<std::vector<double>> &grid, int width,
                  int height, int start, int target,
                  const std::set<int> &bannedNodes,
                  const std::set<std::pair<int, int>> &bannedEdges,
                  const std::vector<double> &heuristic,
                  Route &result) {
  const int nodeCount = width * height;
  if (bannedNodes.count(start) || bannedNodes.count(target)) return false;

  std::vector<double> distance(nodeCount, std::numeric_limits<double>::infinity());
  std::vector<int> parent(nodeCount, -1);
  std::priority_queue<QueueItem, std::vector<QueueItem>, QueueItemGreater> open;

  distance[start] = 0.0;
  open.push({heuristic[start], 0.0, start});

  const int dx[4] = {0, 0, -1, 1};
  const int dy[4] = {-1, 1, 0, 0};

  while (!open.empty()) {
    const QueueItem current = open.top();
    open.pop();

    if (current.pathCost != distance[current.node]) continue;
    if (current.node == target) break;

    const auto [x, y] = fromNodeId(current.node, width);
    for (int direction = 0; direction < 4; ++direction) {
      const int nx = x + dx[direction];
      const int ny = y + dy[direction];
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

      const int next = toNodeId(nx, ny, width);
      if (bannedNodes.count(next) || bannedEdges.count({current.node, next})) continue;
      const double terrainCost = grid[ny][nx];
      if (terrainCost < 0.0) continue;

      const double nextCost = current.pathCost + terrainCost;
      if (nextCost < distance[next]) {
        distance[next] = nextCost;
        parent[next] = current.node;
        open.push({nextCost + heuristic[next], nextCost, next});
      }
    }
  }

  if (!std::isfinite(distance[target])) return false;

  std::vector<int> reversed;
  for (int node = target; node != -1; node = parent[node]) {
    reversed.push_back(node);
    if (node == start) break;
  }
  if (reversed.empty() || reversed.back() != start) return false;

  std::reverse(reversed.begin(), reversed.end());
  result.nodes = std::move(reversed);
  result.cost = distance[target];
  return true;
}

double pathCost(const std::vector<int> &path,
                const std::vector<std::vector<double>> &grid, int width) {
  double total = 0.0;
  for (std::size_t i = 1; i < path.size(); ++i) {
    const auto [x, y] = fromNodeId(path[i], width);
    total += grid[y][x];
  }
  return total;
}

std::vector<Route> yenKShortestPaths(
    const std::vector<std::vector<double>> &grid, int width, int height,
    int start, int target, int wanted) {
  std::vector<Route> accepted;
  std::set<std::vector<int>> knownPaths;
  std::priority_queue<Route, std::vector<Route>, RouteGreater> candidates;
  const std::vector<double> heuristic =
      reverseDistancesToTarget(grid, width, height, target);

  Route first;
  if (!shortestPath(grid, width, height, start, target, {}, {}, heuristic,
                    first)) {
    return accepted;
  }
  accepted.push_back(first);
  knownPaths.insert(first.nodes);

  for (int routeIndex = 1; routeIndex < wanted; ++routeIndex) {
    const std::vector<int> &previous = accepted.back().nodes;

    for (std::size_t spurIndex = 0; spurIndex + 1 < previous.size(); ++spurIndex) {
      std::vector<int> root(previous.begin(), previous.begin() + spurIndex + 1);
      const int spurNode = root.back();

      std::set<int> bannedNodes;
      for (std::size_t i = 0; i + 1 < root.size(); ++i) {
        bannedNodes.insert(root[i]);
      }

      std::set<std::pair<int, int>> bannedEdges;
      for (const Route &route : accepted) {
        if (route.nodes.size() > spurIndex + 1 && hasPrefix(route.nodes, root)) {
          bannedEdges.insert({route.nodes[spurIndex], route.nodes[spurIndex + 1]});
        }
      }

      Route spur;
      if (!shortestPath(grid, width, height, spurNode, target, bannedNodes,
                        bannedEdges, heuristic, spur)) {
        continue;
      }

      std::vector<int> combined(root.begin(), root.end() - 1);
      combined.insert(combined.end(), spur.nodes.begin(), spur.nodes.end());
      if (knownPaths.insert(combined).second) {
        candidates.push({combined, pathCost(combined, grid, width)});
      }
    }

    if (candidates.empty()) break;
    accepted.push_back(candidates.top());
    candidates.pop();
  }

  return accepted;
}

json pathToJson(const std::vector<int> &path, int width) {
  json output = json::array();
  for (int node : path) {
    const auto [x, y] = fromNodeId(node, width);
    output.push_back({{"x", x}, {"y", y}});
  }
  return output;
}

void printError(const std::string &code, const std::string &message) {
  json output = {{"status", "error"}, {"error_code", code}, {"message", message}};
  std::cout << output.dump(2) << '\n';
}

}  // namespace

int main(int argc, char *argv[]) {
  if (argc > 2) {
    printError("USAGE", "استخدم: rover_pathfinder [مسار_ملف_JSON]، أو ضع input.json في مجلد التشغيل.");
    return 2;
  }

  const std::string inputPath = argc == 2 ? argv[1] : "input.json";
  std::ifstream inputFile(inputPath, std::ios::binary);
  if (!inputFile) {
    printError("FILE_NOT_FOUND", "تعذر فتح ملف الإدخال: " + inputPath);
    return 1;
  }

  try {
    json document;
    inputFile >> document;
    if (!document.is_object()) {
      throw std::runtime_error("يجب أن يكون محتوى الملف كائن JSON.");
    }

    if (!document.contains("width") || !document.contains("height")) {
      throw std::runtime_error("يجب توفير width و height.");
    }
    const int width = readInteger(document.at("width"), "width");
    const int height = readInteger(document.at("height"), "height");
    if (width <= 0 || height <= 0) {
      throw std::runtime_error("يجب أن يكون width و height أكبر من صفر.");
    }
    const std::int64_t cellCount = static_cast<std::int64_t>(width) * height;
    if (cellCount > kMaxGridCells) {
      throw std::runtime_error("حجم الشبكة أكبر من الحد المدعوم (مليون خلية).");
    }

    const Coordinate start = readCoordinate(document, "start");
    const Coordinate target = readCoordinate(document, "target");
    const auto inBounds = [width, height](const Coordinate &point) {
      return point.x >= 0 && point.x < width && point.y >= 0 && point.y < height;
    };
    if (!inBounds(start) || !inBounds(target)) {
      throw std::runtime_error("إحداثيات البداية أو الهدف خارج حدود الشبكة.");
    }

    if (!document.contains("grid") || !document.at("grid").is_array()) {
      throw std::runtime_error("grid يجب أن تكون مصفوفة ثنائية الأبعاد.");
    }
    const json &inputGrid = document.at("grid");
    if (inputGrid.size() != static_cast<std::size_t>(height)) {
      throw std::runtime_error("عدد صفوف grid لا يساوي height.");
    }

    std::vector<std::vector<double>> grid(
        static_cast<std::size_t>(height),
        std::vector<double>(static_cast<std::size_t>(width)));
    for (int y = 0; y < height; ++y) {
      if (!inputGrid.at(static_cast<std::size_t>(y)).is_array() ||
          inputGrid.at(static_cast<std::size_t>(y)).size() !=
              static_cast<std::size_t>(width)) {
        throw std::runtime_error("كل صف في grid يجب أن يحتوي width قيمة.");
      }
      for (int x = 0; x < width; ++x) {
        const json &cell = inputGrid.at(static_cast<std::size_t>(y)).at(
            static_cast<std::size_t>(x));
        if (!cell.is_number()) {
          throw std::runtime_error("كل خلية في grid يجب أن تكون رقمًا.");
        }
        const double value = cell.get<double>();
        if (!std::isfinite(value)) {
          throw std::runtime_error("قيم grid يجب أن تكون أرقامًا منتهية.");
        }
        grid[y][x] = value;
      }
    }

    if (grid[start.y][start.x] < 0.0) {
      throw std::runtime_error("خلية البداية عائق؛ يجب أن تكون تكلفتها صفرًا أو أكبر.");
    }
    if (grid[target.y][target.x] < 0.0) {
      throw std::runtime_error("خلية الهدف عائق؛ يجب أن تكون تكلفتها صفرًا أو أكبر.");
    }

    const int startId = toNodeId(start.x, start.y, width);
    const int targetId = toNodeId(target.x, target.y, width);
    const std::vector<Route> routes =
        yenKShortestPaths(grid, width, height, startId, targetId, kMaxPaths);

    if (routes.empty()) {
      json output = {
          {"status", "error"},
          {"error_code", "NO_PATH"},
          {"message", "لا يوجد مسار آمن بين البداية والهدف."},
          {"paths", json::array()}};
      std::cout << output.dump(2) << '\n';
      return 0;
    }

    json output = {
        {"status", "success"},
        {"message", "تم العثور على المسارات مرتبة حسب أقل تكلفة."},
        {"paths", json::array()}};
    for (std::size_t i = 0; i < routes.size(); ++i) {
      output["paths"].push_back({
          {"rank", i + 1},
          {"cost", routes[i].cost},
          {"path", pathToJson(routes[i].nodes, width)}});
    }
    // Compatibility with the previous response shape: path is the best route.
    output["path"] = pathToJson(routes.front().nodes, width);

    std::cout << output.dump(2) << '\n';
    return 0;
  } catch (const json::parse_error &) {
    printError("INVALID_JSON", "ملف الإدخال ليس JSON صالحًا.");
    return 1;
  } catch (const std::exception &error) {
    printError("INVALID_INPUT", error.what());
    return 1;
  }
}
