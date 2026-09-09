#!/bin/sh
#
# Serves the api and the web app together, for local development.
#
# akouo needs more standing up than it starts itself. Two things are checked
# before anything is launched, because both fail in ways that look like a bug
# in the application rather than a missing dependency:
#
#   - loculus, the object store service. Recordings are uploaded to it and read
#     back from it, so nothing to do with a file works without it. Postgres is
#     in api/docker-compose.yml but nothing reads it yet — EmbeddingModule binds
#     VECTOR_STORE to FileVectorStore, which keeps vectors in a JSON file — so
#     it is not checked for here.
#   - pistis, the authorization server. akouo has no account store of its own,
#     so every page redirects to pistis to sign in. A warning, not an error:
#     it may be running somewhere other than this machine.
#
# Neither is started for you. Bringing containers up is a side effect worth
# asking for explicitly, so this prints the command and stops.
#
# Ctrl-C stops both halves. If either exits on its own the other is stopped
# too, rather than leaving half an application serving.
#
#   ./dev.sh                      api on 3310, web on 3004
#   API_PORT=4310 ./dev.sh        move the api (see the note below)
#
# The api port defaults to 3310 because that is what web/.env calls in
# AKOUO_API_URL. Note that api/src/main.ts reads PORT *before* Nest loads
# api/.env, so the value in that file never reaches it — the port has to come
# from the environment, which is what this script provides. Moving it means
# changing AKOUO_API_URL to match.
#
# The web port is fixed: web's `dev` script passes `next dev -p 3004`, which
# beats any PORT, and OAUTH_REDIRECT_URI in web/.env names 3004 as well. It is
# registered against the client in pistis, so it cannot move unilaterally.
set -eu

cd "$(dirname "$0")"

API_PORT="${API_PORT:-3310}"
WEB_PORT=3004

# loculus: akouo asks it for the URLs the browser uploads to and reads from.
# api/.env carries the same number in LOCULUS_BASE_URL.
LOCULUS_PORT="${LOCULUS_PORT:-3111}"

# pistis: the api verifies access tokens against the issuer, the browser is
# sent to the web app's consent screen.
PISTIS_API_PORT="${PISTIS_API_PORT:-3001}"
PISTIS_WEB_PORT="${PISTIS_WEB_PORT:-3002}"

# `nc` and `lsof` are both common but neither is guaranteed. With neither,
# every check below is skipped rather than guessed at.
have_port_check() {
    command -v lsof >/dev/null 2>&1 || command -v nc >/dev/null 2>&1
}

port_in_use() {
    if command -v lsof >/dev/null 2>&1; then
        lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
    elif command -v nc >/dev/null 2>&1; then
        nc -z 127.0.0.1 "$1" >/dev/null 2>&1
    else
        return 1
    fi
}

if have_port_check; then
    if ! port_in_use "$LOCULUS_PORT"; then
        echo "akouo: loculus is not up on ${LOCULUS_PORT}; recordings need it." >&2
        echo >&2
        echo "  (in the loculus checkout)  pnpm start:server" >&2
        exit 1
    fi

    if port_in_use "$API_PORT"; then
        echo "akouo: port $API_PORT is already in use." >&2
        echo "  Stop whatever holds it, or set API_PORT." >&2
        exit 1
    fi

    if port_in_use "$WEB_PORT"; then
        echo "akouo: port $WEB_PORT is already in use." >&2
        echo "  The web port is fixed at 3004; stop whatever holds it." >&2
        exit 1
    fi

    if ! port_in_use "$PISTIS_API_PORT" || ! port_in_use "$PISTIS_WEB_PORT"; then
        echo "akouo: warning — pistis does not look like it is running on" >&2
        echo "  ${PISTIS_API_PORT}/${PISTIS_WEB_PORT}. Signing in will fail." >&2
        echo "  Start it with ../pistis/dev.sh, then reload." >&2
        echo >&2
    fi
fi

# Job control, so each child leads its own process group. `pnpm` spawns the
# real server as a grandchild, and signalling only the wrapper leaves that
# holding the port.
set -m

api_pid=''
web_pid=''
stopping=''

stop_pid() {
    [ -n "$1" ] || return 0
    kill -TERM "-$1" 2>/dev/null || kill -TERM "$1" 2>/dev/null || true
}

stop_children() {
    stopping='yes'
    stop_pid "$api_pid"
    stop_pid "$web_pid"
}

trap 'stop_children' TERM INT

echo "akouo: api    http://localhost:${API_PORT}"
echo "akouo: web    http://localhost:${WEB_PORT}"
echo

# `start:server` builds before it starts; the api has no watch-and-restart, so
# a change to it means restarting this script.
PORT="$API_PORT" pnpm start:server &
api_pid=$!

pnpm start:web &
web_pid=$!

# Poll both children. `kill -0` asks whether a process is still there without
# signalling it; `wait -n` would be neater but needs bash 4.3+, and this has to
# run under whatever /bin/sh is.
while true; do
    if ! kill -0 "$api_pid" 2>/dev/null; then
        wait "$api_pid" 2>/dev/null && status=0 || status=$?
        [ -n "$stopping" ] || echo "akouo: the api exited ($status); stopping." >&2
        stop_children
        wait "$web_pid" 2>/dev/null || true
        exit "$status"
    fi

    if ! kill -0 "$web_pid" 2>/dev/null; then
        wait "$web_pid" 2>/dev/null && status=0 || status=$?
        [ -n "$stopping" ] || echo "akouo: the web app exited ($status); stopping." >&2
        stop_children
        wait "$api_pid" 2>/dev/null || true
        exit "$status"
    fi

    sleep 1
done
