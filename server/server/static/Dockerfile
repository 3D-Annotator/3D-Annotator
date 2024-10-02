# ! Expects to be build with the root of the repository as its context !

# needs trailing slash!
ARG REGISTRY=''


FROM ${REGISTRY}node:18-alpine as base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN corepack prepare pnpm@latest-8 --activate

# build react project
FROM base as build

WORKDIR /app

ARG FRONTEND_DIR=.

COPY ${FRONTEND_DIR}/package.json .
COPY ${FRONTEND_DIR}/pnpm-lock.yaml .

RUN pnpm install --ignore-scripts --frozen-lockfile

COPY ${FRONTEND_DIR} .

ARG API_BASE=not_set
ENV ANNOTATOR_3D_API_BASE_URL=${API_BASE}

ARG DEBUG=false
ENV ANNOTATOR_3D_DEBUG=${DEBUG}

ARG LOGGING_LEVEL=0
ENV ANNOTATOR_3D_LOGGING_LEVEL=${LOGGING_LEVEL}

ARG BACKEND_VERSION=not_set
ARG BACKEND_VERSION_SHA=not_set
ARG FRONTEND_VERSION=not_set
ARG FRONTEND_VERSION_SHA=not_set
ARG SERVER_VERSION=not_set
ARG SERVER_VERSION_SHA=not_set
ENV ANNOTATOR_3D_BACKEND_VERSION=${BACKEND_VERSION}
ENV ANNOTATOR_3D_BACKEND_VERSION_SHA=${BACKEND_VERSION_SHA}
ENV ANNOTATOR_3D_FRONTEND_VERSION=${FRONTEND_VERSION}
ENV ANNOTATOR_3D_FRONTEND_VERSION_SHA=${FRONTEND_VERSION_SHA}
ENV ANNOTATOR_3D_SERVER_VERSION=${SERVER_VERSION}
ENV ANNOTATOR_3D_SERVER_VERSION_SHA=${SERVER_VERSION_SHA}

RUN pnpm build


FROM ${REGISTRY}nginx:1.22.0-alpine

COPY --from=build /app/build /home/frontend

# delete default config
RUN rm /etc/nginx/conf.d/default.conf
COPY server/static/nginx.conf /etc/nginx/conf.d

CMD ["nginx", "-g", "daemon off;"]
