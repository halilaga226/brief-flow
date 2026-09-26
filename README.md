# Atlı Karakaya Hukuk Bürosu

Görev, taslak inceleme ve evrak gönderim portalı. Avukatlar için iş listesi (ajanda) ve satırdan görev atama içerir. Açık/koyu tema desteklenir.

## Roller

- **Avukat** iş listesine kayıt ekler, satırdan veya Görev ver ile atama yapar; taslağı onaylar veya revize ister. Onaydan sonra masraf, müvekkil araması ve gönderime alma kararını verir.
- **Stajyer** yalnızca kendisine atanan işleri görür. Görev atayamaz. Gönderime alınan işte evrak kodunu girerek işi kapatır.
- **Yönetici (ADMIN)** tüm işleri görür, kullanıcı ekler/düzenler ve Ayarlar’dan örnek veriyi sıfırlar.

Üçüncü kişiler kaydı göremez.

## İş listesi (avukat ajandası)

`/is-listesi` sayfasında müvekkil, karşı taraf, mahkeme, dosya no, yapılacak iş ve notlar tutulur. Her satırdaki **İş ata** ile doğrudan görev verilir.

## Görev döngüsü

1. `ATANDI` — avukat başlık, müvekkil, dosya no, son teslim, talimat ve isteğe bağlı ek ile işi atar.
2. `INCELEME_BEKLIYOR` — yürüten kişi taslağı yükler.
3. `REVIZE_ISTENDI` — avukat not düşerek işi geri gönderir.
4. `ONAYLANDI` — atayan avukat onaylar; masraf yatırma, arama yapılacak / yapıldı ve gönderime alma kararlarını burada verir.
5. `GONDERIM_BEKLIYOR` — atayan avukat gönderime alır.
6. `TAMAMLANDI` — yürüten kişi UYAP, PTT veya merci kodunu girer. Kod yoksa iş kapanmaz.

Görevler varsayılan olarak **liste** görünümündedir. Pano isteğe bağlıdır; sürükle-bırak yoktur.

## Örnek veriyi kaldırma (sıfırdan başlama)

1. Yönetici hesabıyla giriş yapın (kullanıcı adı: `halil` veya oluşturduğunuz ADMIN).
2. Sol menüden **Ayarlar** açın.
3. **Örnek işleri ve hesapları sil** → onaylayın.
4. Tüm görevler ve `@vekalet.local` deneme hesapları silinir. Kendi yönetici hesabınız kalır.
5. **Kullanıcılar** sayfasından gerçek avukat/stajyer ekleyip iş listesinden veya Görev ver ile yeni iş atayın.

Örnek hesapla girişliyken temizleme yapılamaz; önce kendi yönetici hesabınızla girin.

## Kurulum

```bash
npm install
cp .env.example .env
npm run setup
npm run dev
```

Uygulama [http://127.0.0.1:4317](http://127.0.0.1:4317) adresinde açılır. `AUTH_SECRET` için `openssl rand -base64 32` kullanın.

Veritabanı PostgreSQL / Supabase pooler ile çalışır (`DATABASE_URL`, `DIRECT_URL`).

## Deneme hesapları

`DEMO_LOGIN=true` iken giriş ekranında görünür. Ortak parola: `Vekalet2026!`

| Kişi | Rol | Kullanıcı adı |
| --- | --- | --- |
| Ayşe Demir | Kıdemli avukat | ayse.demir |
| Mehmet Kaya | Avukat | mehmet.kaya |
| Elif Yılmaz | Stajyer | elif.yilmaz |
| Can Öztürk | Stajyer | can.ozturk |

Ayarlar’dan örnek veri silinene kadar kullanılabilir.

## Google Drive

Kimlik yokken mod `mock`tur. Yüklenen baytlar diske veya veritabanına yazılmaz.

Gerçek yükleme için (yönetim / ops özellikleri oturduktan sonra):

1. Google Cloud'da Drive API'yi açın ve bir servis hesabı oluşturun.
2. JSON anahtarını tek satır `GOOGLE_SERVICE_ACCOUNT_JSON` olarak yazın.
3. Dosyaların duracağı klasörü kendi Drive'ınızda oluşturun.
4. Klasörü servis hesabının e-postasıyla **Düzenleyici** olarak paylaşın.
5. Klasör kimliğini `GOOGLE_DRIVE_FOLDER_ID` alanına yazın.
6. `DRIVE_SHARE_MODE=private` kalsın.
7. Sunucuyu yeniden başlatın.

Modül `src/lib/drive.ts` içindedir.

## Komutlar

```bash
npm run dev
npm run setup
npm test
npm run lint
npm run build
```
