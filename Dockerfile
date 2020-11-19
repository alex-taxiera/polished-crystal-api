# syntax=docker/dockerfile:1.0.0-experimental

FROM python:3.8-slim AS pybuilder

ENV LANG=C.UTF-8
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .

RUN apt-get update -yq && \
    apt-get install -yq --no-install-recommends \
      build-essential && \
    rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir --user -r requirements.txt

FROM node:fermium-slim as nodebuilder

COPY package*.json ./

RUN apt-get update -yq && \
    apt-get install -yq --no-install-recommends \
      git openssh-client && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p -m 0600 ~/.ssh && ssh-keyscan -t rsa github.com > ~/.ssh/known_hosts
RUN --mount=type=ssh npm ci --no-optional --only=prod

FROM nikolaik/python-nodejs:python3.8-nodejs14-slim AS app

WORKDIR /app

ENV LANG=C.UTF-8
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

EXPOSE 3000

COPY --from=pybuilder /root/.local /root/.local
COPY --from=nodebuilder ./node_modules ./node_modules
COPY . .
ENV PATH=/root/.local/bin:$PATH

CMD ["node", "src"]
