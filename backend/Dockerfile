FROM python:3.11-slim        # use Python 3.11 as the base

WORKDIR /app                 # set working directory inside container

COPY requirements.txt .      # copy requirements first
RUN pip install --no-cache-dir -r requirements.txt  # install all packages

COPY . .                     # copy all your code

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
# run uvicorn when container starts