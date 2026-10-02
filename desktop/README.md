# Atlı Karakaya · Masaüstü Uygulama

Web portalunun aynısını masaüstünde açar + otomatik yedek alır.

## İndirme (Windows)

1. **[Atlı Karakaya Windows v1.2.0](https://github.com/halilaga226/brief-flow/releases/download/yedek-ajani-v1.2.0/Atli-Karakaya-Windows-Portable.zip)** indirin  
2. Zip’i açın  
3. `Atli Karakaya.exe` → sağ tık → **Gönder → Masaüstü (kısayol)**  
4. İkona çift tıklayın  

### Microsoft engellerse

**SmartScreen:** Ek bilgi → Yine de çalıştır  

**Smart App Control:** Ayarlar → Windows Güvenliği → Uygulama ve tarayıcı denetimi → Akıllı Uygulama Denetimi → Kapalı → bilgisayarı yeniden başlat  

```powershell
Get-ChildItem -Recurse ".\win-unpacked" | Unblock-File
```

## İlk ayar (Ayarlar butonu)

| Alan | Değer |
|------|--------|
| Portal adresi | `https://brief-flow-ashy.vercel.app` |
| Ajan anahtarı | Vercel’deki `BACKUP_AGENT_TOKEN` (boşluksuz) |
| Yedek klasörü | Varsayılan: Belgeler → Atli-Karakaya-Yedekler |

**Kaydet ve siteyi aç** → site pencerede açılır.  
Üstten **Yedek al** → JSON bilgisayara yazılır.

## Geliştirici

```bash
cd desktop
npm install
npm start
npm run dist:dir   # win-unpacked
```
