#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# تحديد مسار الباك إند (يدعم مسار مجلداتك الفعلي على Fedora)
if [ -d "$HOME/projects/php/all done/laravel" ]; then
    BACKEND_DIR="$HOME/projects/php/all done/laravel"
else
    BACKEND_DIR="$SCRIPT_DIR/all done/laravel"
fi

# تحديد مسار الفرونت إند
if [ -d "$SCRIPT_DIR/frontend" ]; then
    FRONTEND_DIR="$SCRIPT_DIR/frontend"
else
    FRONTEND_DIR="$SCRIPT_DIR/mars-frontend-brief/frontend"
fi

# التحقق من وجود الملفات الأساسية
if [ ! -f "$BACKEND_DIR/artisan" ]; then
    echo "Backend not found: $BACKEND_DIR"
    exit 1
fi

if [ ! -f "$FRONTEND_DIR/package.json" ]; then
    echo "Frontend not found: $FRONTEND_DIR"
    exit 1
fi

# دالة لإيقاف الخادمين معاً عند الضغط على Ctrl+C
cleanup() {
    echo ""
    echo "جاري إيقاف خوادم AresNav..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM

echo "Starting AresNav Backend :8001..."
(cd "$BACKEND_DIR" && php artisan serve --host=127.0.0.1 --port=8001) &
BACKEND_PID=$!

echo "Starting AresNav Frontend :5173..."
(
    cd "$FRONTEND_DIR"
    [ ! -f "node_modules/.bin/vite" ] && npm install
    VITE_BACKEND_URL=http://127.0.0.1:8001 VITE_USE_MOCK=false npm run dev
) &
FRONTEND_PID=$!

sleep 5
xdg-open "http://localhost:5173" >/dev/null 2>&1 || true

echo "الخادمان يعملان الآن. اضغط Ctrl+C لإيقافهما معاً."
wait
