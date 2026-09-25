# Vekâlet

Küçük ve orta ölçekli hukuk büroları için görev, taslak inceleme ve evrak gönderim portalı. Avukat iş atar; stajyer veya diğer avukat yürütür. Belge içeriği sunucuda durmaz: Google Drive kimliği tanımlıysa dosya klasöre gider, değilse yalnızca ad, boyut ve bağlantı kaydı tutulur.

## Roller

- **Avukat** görev atar, taslağı onaylar veya revize ister. Kendisinin atadığı, kendisine atanan ve taraf olduğu işleri görür.
- **Stajyer** yalnızca kendisine atanan işleri görür. Görev atayamaz. Onaydan sonra evrak kodunu girerek işi kapatır.

Üçüncü kişiler kaydı göremez. Yönetici / büro geneli görünümü yoktur.

## Görev döngüsü

1. `ATANDI` — avukat başlık, müvekkil, dosya no, son teslim, talimat ve isteğe bağlı ek ile işi atar.
2. `INCELEME_BEKLIYOR` — yürüten kişi taslağı yükler.
3. `REVIZE_ISTENDI` — avukat not düşerek işi geri gönderir. Yeni taslak yine incelemeye döner.
4. `GONDERIM_BEKLIYOR` — avukat onaylar.
5. `TAMAMLANDI` — yürüten kişi UYAP, PTT veya merci kodunu girer. Kod yoksa iş kapanmaz.

Pano sürükle-bırak değildir. Her kartın üzerine gelince veya geçmiş düğmesinden işlem saati, not ve kod görünür. Görev içinde kısa bir iç not dizisi vardır.

## Kurulum

```bash
npm install
cp .env.example .env
npm run setup
npm run dev
```

Uygulama [http://127.0.0.1:4317](http://127.0.0.1:4317) adresinde açılır. `AUTH_SECRET` için `openssl rand -base64 32` kullanın.

Veritabanı yerel SQLite'tır (`prisma/dev.db`). Şema Prisma ile durur; Postgres veya Supabase'e geçmek için `provider` ve `DATABASE_URL` değiştirilip `npm run setup` tekrarlanır.

## Deneme hesapları

Ortak parola: `Vekalet2026!`

| Kişi | Rol | E-posta |
| --- | --- | --- |
| Ayşe Demir | Kıdemli avukat | ayse.demir@vekalet.local |
| Mehmet Kaya | Avukat | mehmet.kaya@vekalet.local |
| Elif Yılmaz | Stajyer | elif.yilmaz@vekalet.local |
| Can Öztürk | Stajyer | can.ozturk@vekalet.local |

Giriş ekranındaki kartlar hesabı doğrudan açar. Örnek veri, avukatlar arası bir işin stajyere görünmediğini de içerir.

## Google Drive

Kimlik yokken mod `mock`tur. Yüklenen baytlar diske veya veritabanına yazılmaz; önizleme sayfası yalnızca meta veriyi gösterir.

Gerçek yükleme için:

1. Google Cloud'da Drive API'yi açın ve bir servis hesabı oluşturun.
2. JSON anahtarını tek satır `GOOGLE_SERVICE_ACCOUNT_JSON` olarak yazın.
3. Dosyaların duracağı klasörü kendi Drive'ınızda oluşturun. Servis hesaplarının kotası olmadığı için klasör size ait olmalıdır.
4. Klasörü servis hesabının e-postasıyla **Düzenleyici** olarak paylaşın.
5. Klasör kimliğini `GOOGLE_DRIVE_FOLDER_ID` alanına yazın.
6. `DRIVE_SHARE_MODE=private` kalsın. `anyone` seçilirse bağlantısı olan herkes dosyayı okuyabilir; müvekkil evrakı için önerilmez.
7. Sunucuyu yeniden başlatın.

Modül `src/lib/drive.ts` içindedir: klasör doğrulama, yükleme, paylaşım bağlantısı ve başarısız kayıtta Drive dosyasını silme.

## Komutlar

```bash
npm run dev
npm run setup
npm test
npm run lint
npm run build
```
