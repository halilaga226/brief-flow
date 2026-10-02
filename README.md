# Atlı Karakaya Hukuk Bürosu

Görev, inceleme ve evrak gönderim portalı. Müvekkil → dosya → iş hiyerarşisi, stajyer/avukat iş listeleri ve isteğe bağlı Google Drive içerir.

## Roller

- **Avukat** müvekkil/dosya yönetir, görev atar, gelen işi inceler. Stajyer işlerini ayrı sekmeden görür; yalnızca kendi atadığı işlere müdahale eder. Ayarlar’dan kendi Drive klasörünü bağlayabilir.
- **Stajyer** müvekkilleri görüntüleyebilir ve müvekkil notu ekleyebilir; müvekkil/dosya düzenleyemez. Atanan işi doğrudan listesinde görür. Bitince **Avukata gönder** + not yazar; iş listesinden düşer, atayan avukata gider.
- **Yönetici** tüm işleri görür, kullanıcı ekler, örnek veriyi sıfırlar.

## İş listesi

- **Bana gelen** — size atanan aktif işler (avukat↔avukat dahil).
- **Verdiğim** — sizin atadıklarınız; inceleme bekleyenler burada.
- Avukata gönderilince iş atananın listesinden kalkar.

## Müvekkiller

Sol menü **Müvekkiller**: müvekkil → dosya → o dosyadaki tüm işler. Görev atarken:

1. Müvekkil yoksa oluşturulur.
2. Aynı dosya no varsa iş o dosyaya bağlanır; yoksa yeni dosya açılır.

## Görev döngüsü

1. `ATANDI` — atama; iş hemen atananın listesine düşer.
2. `INCELEME_BEKLIYOR` — yürüten **Avukata gönder** + yapılanlar notu.
3. `KONTROL_EDILECEK` — avukat gelen işi **Kontrol edilecekler** klasörüne alır (tamamlananlardan ayrı).
4. `REVIZE_ISTENDI` — avukat notla geri yollar.
5. `ONAYLANDI` — masraf / arama / gönderime alma.
6. `GONDERIM_BEKLIYOR` — gönderime alındı.
7. `TAMAMLANDI` — evrak takip kodu veya avukatın doğrudan tamamlaması; istenirse tekrar **Kontrol edileceklere** alınabilir.

Avukat, stajyerden gelen işte **Kontrol edilecek** veya **Tamamlananlara al** seçebilir; klasik onay/revize de durur. Tamamlanan bir işi tekrar kontrol klasörüne taşıyabilir.

## Müvekkil notları

Müvekkil detayında avukat ve stajyer ortak notlar bırakabilir (görüşme, hatırlatma vb.). Kendi notunu (veya avukat tüm notları) silebilir.

## Müvekkiller ve silinenler

- Müvekkil ve dosya düzenlenebilir; silince **Silinenler** klasörüne düşer, oradan geri yüklenir.
- Görev silmek de soft-delete ile aynı klasöre gider.

## Google Drive (isteğe bağlı)

- **Büro (Halil):** Ayarlar → «Büro Google Drive» — servis hesabı JSON + klasör kimliği. Kaydetmeden önce bağlantı test edilir; JSON şifreli saklanır. Alternatif: `GOOGLE_SERVICE_ACCOUNT_JSON` + `GOOGLE_DRIVE_FOLDER_ID` (Vercel env öncelikli).
- Klasörü servis hesabı e-postasıyla **Düzenleyici** paylaşın.
- **Avukat:** Ayarlar → kişisel klasör kimliği; isteğe bağlı stajyer yazma erişimi.

## Güvenlik

- Başka kullanıcıların parolasını **yalnızca `halil`** sıfırlayabilir.
- Silinen veya parolası değişen hesabın açık oturumu geçersiz sayılır.
- Halil / yönetici Ayarlar’dan tüm müvekkilleri kalıcı silebilir; ardından JSON yeniden yüklenir.

### Canlı bildirimler

Ayarlar → **Canlı bildirimler** ile masaüstü izni verin. Yeni iş, inceleme, revizyon, onay, gönderim ve dosya güncellemeleri renkli popup olarak görünür; sekme arkadayken tarayıcı bildirimi de gelir.

### Güvenliği artırmak için öneriler

1. **2FA / TOTP** — özellikle avukat ve yönetici hesaplarında zorunlu ikinci faktör.
2. **IP / ofis kısıtı** — portalı yalnızca büro VPN veya bilinen IP aralığına açmak (Vercel Firewall / Cloudflare Access).
3. **Audit log** — müvekkil silme, not silme, parola sıfırlama ve Drive ayarı değişikliklerini kalıcı günlükte tutmak.
4. **Müvekkil notlarında yetki ayrımı** — hassas mali/kişisel notları yalnız avukata görünür işaretlemek.
5. **Oturum süresi** — JWT maxAge kısaltmak; uzun süre hareketsizlikte yeniden giriş.
6. **Rate limit** — giriş ve parola sıfırlamada deneme sayısı sınırı (brute-force).
7. **Yedekleme & silinenler** — soft-delete sonrası otomatik kalıcı silme süresi (örn. 90 gün) ve düzenli DB yedek.
8. **Drive sırları** — servis hesabı JSON’u yalnızca şifreli saklamak; Vercel env’leri rotate etmek.
9. **Rol gözden geçirme** — stajyer erişimini periyodik kontrol; ayrılan hesabı hemen pasifleştirmek.
10. **HTTPS + güvenlik başlıkları** — CSP, HSTS (Vercel varsayılanları + sıkılaştırma).

## Performans

Yapılanlar: liste kartlarında timeline yükü kaldırıldı; sayfalar daha hafif.

İleride: Vercel Edge cache / `unstable_cache`, bildirim polling yerine SSE, görsellerin lazy load’u.

## Masaüstü sürümü

Ayrı Electron/Tauri uygulaması şart değil. Kısa vadede:

1. **PWA** — “Ana ekrana ekle” / tarayıcıda uygulama gibi (en düşük maliyet).
2. **Tauri / Electron** — aynı Next.js’i sarmalar; dağıtım ve güncelleme maliyeti yüksek.

Öneri: önce PWA; ihtiyaç olursa Tauri.

## Kurulum

```bash
npm install
cp .env.example .env
npm run setup
npm run dev
```

[http://127.0.0.1:4317](http://127.0.0.1:4317) — `AUTH_SECRET` için `openssl rand -base64 32`.

## Deneme hesapları

`DEMO_LOGIN=true` — parola `Vekalet2026!`

| Kişi | Rol | Kullanıcı adı |
| --- | --- | --- |
| Ayşe Demir | Kıdemli avukat | ayse.demir |
| Mehmet Kaya | Avukat | mehmet.kaya |
| Elif Yılmaz | Stajyer | elif.yilmaz |
| Can Öztürk | Stajyer | can.ozturk |

## Komutlar

```bash
npm run dev
npm run setup
npm test
npm run lint
npm run build
```
