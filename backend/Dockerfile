FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /app
COPY requirements.lock ./
RUN pip install --no-cache-dir -r requirements.lock
COPY pyproject.toml ./
COPY panapulse ./panapulse
RUN pip install --no-cache-dir --no-deps . && useradd --uid 10001 --create-home app && mkdir /data && chown app:app /data
USER app
ENV DATABASE_URL=sqlite:////data/panapulse.db
EXPOSE 8000
CMD ["uvicorn", "panapulse.api:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--proxy-headers", "--no-access-log"]
