# Atlı Karakaya · Masaüstü Yedek Ajanı

Portal ile entegre çalışan küçük bir bilgisayar uygulaması. Site üzerinden yedek alır, **bu bilgisayara** JSON olarak kaydeder; istenirse aynı dosyayı siteye geri yükler.

## Gereksinimler

- Windows / macOS / Linux
- [Node.js 20+](https://nodejs.org/)
- Portalda `BACKUP_AGENT_TOKEN` tanımlı olmalı (Vercel Environment Variables + yerel `.env`)

## Kurulum

```bash
cd desktop
npm install
npm start
```

İlk açılışta:

1. **Portal adresi** — canlı site URL’niz (örn. `https://….vercel.app`) veya yerel `http://127.0.0.1:4317`
2. **Ajan anahtarı** — sunucudaki `BACKUP_AGENT_TOKEN` değeri (parola değil; yalnızca yedek API için)
3. **Yedek klasörü** — varsayılan: Belgeler → `Atli-Karakaya-Yedekler`
4. **Ayarları kaydet** → **Şimdi yedekle**

Uygulama kapatılınca sistem tepsisinde kalır; otomatik aralıkla yedek almaya devam eder.

## Güvenlik

- Anahtarı yalnızca ofis bilgisayarında tutun; paylaşmayın.
- Anahtar çalınırsa Vercel’de yeni `BACKUP_AGENT_TOKEN` üretip eskiyi silin.
- «Siteye yükle» mevcut portal verisinin üzerine yazabilir — onay ister.
