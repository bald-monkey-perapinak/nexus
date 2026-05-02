import asyncio
import os
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes

load_dotenv()

BOT_TOKEN = os.environ["BOT_TOKEN"]
WEBAPP_URL = os.environ["WEBAPP_URL"]


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    name = user.first_name if user else "предприниматель"

    keyboard = [[
        InlineKeyboardButton(
            "🔷 Открыть Nexus",
            web_app=WebAppInfo(url=WEBAPP_URL)
        )
    ]]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(
        f"Привет, {name}!\n\n"
        "**Nexus** — AI-платформа для предпринимателей.\n\n"
        "Заполните профиль за 2 минуты и получите бизнес-идеи, "
        "точно подобранные под ваш капитал, опыт и цели. "
        "Плюс финансовые модели и роадмап на 90 дней.\n\n"
        "👇 Нажмите кнопку чтобы начать",
        reply_markup=reply_markup,
        parse_mode="Markdown"
    )


async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(
        "Nexus — Бизнес-идеи под ваш профиль\n\n"
        "/start — Открыть платформу\n\n"
        "Вопросы: @nexus_support"
    )


def main() -> None:
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_cmd))
    print(f"Nexus Bot starting... WEBAPP_URL={WEBAPP_URL}")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
