const { Telegraf } = require('telegraf');

const bot = new Telegraf('8895754519:AAEUCY0iDqF3VbudH3ewLLHoLogTjkkYnyc');

bot.start((ctx) => {
    ctx.reply('Halo! Kirimkan **Emoji Premium** untuk mendapatkan ID-nya, atau kirimkan **ID Angka** untuk melihat bentuk emojinya.', { parse_mode: 'Markdown' });
});

bot.on('message', async (ctx) => {
    const message = ctx.message;
    // Menangkap teks baik dari pesan biasa maupun dari caption gambar/dokumen
    const text = message.text || message.caption || '';

    // Skenario 1: Ekstrak ID dan Bentuk Visual dari pesan Custom Emoji
    if (message.entities || message.caption_entities) {
        const entities = message.entities || message.caption_entities;
        let foundEmojis = [];

        entities.forEach(entity => {
            if (entity.type === 'custom_emoji') {
                // Mengekstrak wujud emoji dari teks asli berdasarkan titik offset
                const emojiChar = text.substring(entity.offset, entity.offset + entity.length);
                // Menggabungkan emoji dengan ID-nya. ID diapit backtick agar bisa disalin cepat.
                foundEmojis.push(`${emojiChar} = \`${entity.custom_emoji_id}\``);
            }
        });

        if (foundEmojis.length > 0) {
            // Menyusun format akhir dengan header "EMOJI VALID"
            const replyText = `**EMOJI VALID**\n${foundEmojis.join('\n')}`;
            return ctx.reply(replyText, { parse_mode: 'Markdown' });
        }
    }

    // Skenario 2: Menguji ID Angka
    if (/^\d+$/.test(text.trim())) {
        const emojiId = text.trim();
        
        try {
            const stickers = await ctx.telegram.getCustomEmojiStickers([emojiId]);

            if (stickers && stickers.length > 0) {
                const baseEmoji = stickers[0].emoji || '✨';

                // 1. Rakit teks murni tanpa tag HTML sama sekali
                const pesanTeks = `✅ ID VALID\n${baseEmoji} Emoji baru tersimpan\n\n${emojiId}`;
                
                // 2. Buat array koordinat entitas secara manual
                const entitasManual = [
                    {
                        type: 'bold',
                        offset: pesanTeks.indexOf('ID VALID'),
                        length: 8
                    },
                    {
                        type: 'custom_emoji',
                        offset: pesanTeks.indexOf(baseEmoji), // Mencari otomatis di karakter ke berapa emoji ini berada
                        length: baseEmoji.length, 
                        custom_emoji_id: emojiId
                    },
                    {
                        type: 'code',
                        offset: pesanTeks.lastIndexOf(emojiId),
                        length: emojiId.length
                    }
                ];

                // 3. Kirim pesan dengan melampirkan parameter 'entities', BUKAN 'parse_mode'
                return ctx.reply(pesanTeks, { entities: entitasManual });
            } else {
                return ctx.reply('❌ Gagal. ID Emoji tidak ditemukan atau tidak valid.');
            }
        } catch (error) {
            console.error("Error mengambil emoji:", error);
            return ctx.reply('Terjadi kesalahan saat memproses ID tersebut.');
        }
    }

    // Skenario 3: Pesan diabaikan jika tidak sesuai
    if (text && !text.startsWith('/')) {
        ctx.reply('Harap kirimkan emoji premium atau deretan angka ID.');
    }
});

bot.launch().then(() => {
    console.log('Bot Tester Emoji berjalan (Mode Injeksi Entitas Manual API)...');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
