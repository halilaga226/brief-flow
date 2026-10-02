# Atlı Karakaya · Masaüstü Yedek Ajanı

Evet — bu **gerçek bir masaüstü programı**. Kurulum / açılıştan sonra masaüstünde
veya Başlat menüsünde **«Atlı Karakaya Yedek»** ikonu (kalkan amblemi) ile erişirsiniz.

## Windows’a kurulum

### Yol 1 — Hazır indirme (en kolay)

1. Bu linkten zip’i indirin:  
   **[Windows Yedek Ajanı (Portable)](https://github.com/halilaga226/brief-flow/releases/download/yedek-ajani-v1.0.0/Atli-Karakaya-Yedek-Ajani-Windows-Portable.zip)**
2. Zip’i açın (ör. Masaüstü’ne)
3. İçindeki **`Atli Karakaya Yedek Ajani.exe`** dosyasına sağ tıklayın  
   → **Gönder → Masaüstü (kısayol oluştur)**
4. Masaüstündeki ikona çift tıklayın
5. Portal URL + `BACKUP_AGENT_TOKEN` girin → **Ayarları kaydet** → **Şimdi yedekle**

### Yol 2 — Kurulum dosyası (Setup.exe)

Windows bilgisayarda bir kez paket üretin:

```bash
cd desktop
npm install
npm run dist
```

`desktop/release/` içinde **Setup.exe** oluşur. Çift tıklayıp kurun:
- Masaüstü kısayolu otomatik gelir
- Başlat menüsüne de eklenir

### Yol 3 — Geliştirici (Node)

```bash
cd desktop
npm install
npm start
```

Aynı pencereli uygulama açılır; kalıcı ikon için Yol 1 veya 2’yi kullanın.

## İlk açılış ayarları

1. **Portal adresi** — canlı site URL’niz  
2. **Ajan anahtarı** — Vercel `BACKUP_AGENT_TOKEN`  
3. **Ayarları kaydet** → **Şimdi yedekle**  

Yedekler varsayılan olarak **Belgeler → Atli-Karakaya-Yedekler** klasörüne yazılır.
Pencereyi kapatınca sistem tepsisinde çalışmaya devam eder.

## Site tarafı (bir kez)

Vercel → Environment Variables → `BACKUP_AGENT_TOKEN` ekleyin → Redeploy.

## Not

Siteden «Yedek al ve indir» yeterliyse bu uygulamayı kurmak **zorunlu değil**.
Otomatik / arka planda diske yazmak istiyorsanız masaüstü programı kullanın.
