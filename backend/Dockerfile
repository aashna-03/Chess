FROM python:3.11-slim

# install stockfish
RUN apt-get update && \
    apt-get install -y stockfish && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# copy and install requirements first (better caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copy all backend code
COPY . .

# expose port
EXPOSE 8000

# run the app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]