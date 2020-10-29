# syntax=docker/dockerfile:1.0.0-experimental

FROM nikolaik/python-nodejs:python3.8-nodejs14-slim AS app

WORKDIR /app

ENV LANG=C.UTF-8
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

EXPOSE 3000

COPY . .

RUN apt-get update -yq && \
    apt-get install -yq --no-install-recommends \
      git openssh-client build-essential && \
    rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir -r requirements.txt

RUN mkdir -p -m 0600 ~/.ssh && ssh-keyscan -t rsa github.com > ~/.ssh/known_hosts
RUN --mount=type=ssh npm ci --no-optional --only=prod

CMD ["npm", "start"]
