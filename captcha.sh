#!/bin/bash
# 验证码识别服务管理脚本
# 用法: ./captcha.sh start|stop|status|install|uninstall

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER="$SCRIPT_DIR/captcha_server.py"
PIDFILE="/tmp/captcha_server.pid"
PLIST="$SCRIPT_DIR/com.xuetong.captcha.plist"
PLIST_TARGET="$HOME/Library/LaunchAgents/com.xuetong.captcha.plist"

start() {
    if curl -s http://127.0.0.1:19876/ocr -o /dev/null -w '' --connect-timeout 1 2>/dev/null; then
        echo "[*] 服务已在运行"
        return
    fi
    echo "[*] 启动验证码识别服务..."
    cd "$SCRIPT_DIR"
    nohup /usr/local/bin/python3.8 "$SERVER" > /tmp/captcha_server.log 2>&1 &
    echo $! > "$PIDFILE"
    sleep 1
    if curl -s http://127.0.0.1:19876/ocr -o /dev/null -w '' --connect-timeout 1 2>/dev/null; then
        echo "[+] 服务启动成功 (PID: $(cat $PIDFILE))"
    else
        echo "[!] 启动失败，查看日志: /tmp/captcha_server.log"
    fi
}

stop() {
    if [ -f "$PIDFILE" ]; then
        kill "$(cat "$PIDFILE")" 2>/dev/null
        rm -f "$PIDFILE"
        echo "[*] 服务已停止"
    else
        pkill -f "captcha_server.py" 2>/dev/null
        echo "[*] 服务已停止"
    fi
}

status() {
    if curl -s http://127.0.0.1:19876/ocr -o /dev/null -w '' --connect-timeout 1 2>/dev/null; then
        echo "[+] 服务运行中"
    else
        echo "[-] 服务未运行"
    fi
}

install() {
    cp "$PLIST" "$PLIST_TARGET"
    launchctl load "$PLIST_TARGET" 2>/dev/null
    echo "[+] 已安装为开机自启服务"
    echo "[*] 服务将在每次开机时自动启动"
}

uninstall() {
    launchctl unload "$PLIST_TARGET" 2>/dev/null
    rm -f "$PLIST_TARGET"
    stop
    echo "[*] 已卸载自启服务"
}

case "${1:-start}" in
    start)      start ;;
    stop)       stop ;;
    restart)    stop; sleep 1; start ;;
    status)     status ;;
    install)    install ;;
    uninstall)  uninstall ;;
    *)          echo "用法: $0 {start|stop|restart|status|install|uninstall}" ;;
esac
