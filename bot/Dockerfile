FROM python:3.11-slim
WORKDIR /app
RUN pip install --no-cache-dir python-telegram-bot==20.7 python-dotenv==1.0.1
COPY . .
CMD ["python", "bot.py"]
