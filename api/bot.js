const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
    ctx.reply('Halo! Kirimkan **Emoji Premium** untuk mendapatkan ID-nya, atau kirimkan **ID Angka** untuk melihat bentuk emojinya.', { parse_mode: 'Markdown' });
});

bot.on('message', async (ctx) => {
    const message = ctx.message;
    const text = message.text || message.caption || '';

    if (message.entities || message.caption_entities) {
        const entities = message.entities || message.caption_entities;
        let foundEmojis = [];

        entities.forEach(entity => {
            if (entity.type === 'custom_emoji') {
                const emojiChar = text.substring(entity.offset, entity.offset + entity.length);
                foundEmojis.push(`${emojiChar} = \`${entity.custom_emoji_id}\``);
            }
        });

        if (foundEmojis.length > 0) {
            const replyText = `**EMOJI VALID**\n${foundEmojis.join('\n')}`;
            return ctx.reply(replyText, { parse_mode: 'Markdown' });
        }
    }

    if (/^\d+$/.test(text.trim())) {
        const emojiId = text.trim();
        
        try {
            const stickers = await ctx.telegram.getCustomEmojiStickers([emojiId]);

            if (stickers && stickers.length > 0) {
                const baseEmoji = stickers[0].emoji || '✨';
                const pesanTeks = `✅ ID VALID\n${baseEmoji} Emoji baru tersimpan\n\n${emojiId}`;
                
                const entitasManual = [
                    {
                        type: 'bold',
                        offset: pesanTeks.indexOf('ID VALID'),
                        length: 8
                    },
                    {
                        type: 'custom_emoji',
                        offset: pesanTeks.indexOf(baseEmoji),
                        length: baseEmoji.length, 
                        custom_emoji_id: emojiId
                    },
                    {
                        type: 'code',
                        offset: pesanTeks.lastIndexOf(emojiId),
                        length: emojiId.length
                    }
                ];

                return ctx.reply(pesanTeks, { entities: entitasManual });
            } else {
                return ctx.reply('❌ Gagal. ID Emoji tidak ditemukan atau tidak valid.');
            }
        } catch (error) {
            console.error("Error mengambil emoji:", error);
            return ctx.reply('Terjadi kesalahan saat memproses ID tersebut.');
        }
    }

    if (text && !text.startsWith('/')) {
        ctx.reply('Harap kirimkan emoji premium atau deretan angka ID.');
    }
});

// Ekspor handler khusus serverless Vercel
module.exports = async (req, res) => {
    try {
        if (req.method === 'POST') {
            await bot.handleUpdate(req.body);
            res.status(200).send('OK');
        } else {
            res.status(200).send('Bot Telegram berjalan dengan baik di Vercel!');
        }
    } catch (e) {
        console.error("Error webhook:", e);
        res.status(500).send('Internal Server Error');
    }
};
