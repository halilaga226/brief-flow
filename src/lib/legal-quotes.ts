import { istanbulDayKey } from "@/lib/format"

export const LEGAL_QUOTES: { text: string; source: string }[] = [
  {
    text: "Kanunu bilmemek mazeret sayılmaz.",
    source: "Hukukun genel ilkesi",
  },
  {
    text: "Hak, aranmadan verilmez.",
    source: "Usul ilkesi",
  },
  {
    text: "Şüphe, sanığın lehine yorumlanır.",
    source: "In dubio pro reo",
  },
  {
    text: "Sözleşme, tarafların kanunudur.",
    source: "Pacta sunt servanda",
  },
  {
    text: "Kimse kendi hukuksuzluğundan yararlanamaz.",
    source: "Nemo auditur",
  },
  {
    text: "Adalet gecikirse zayıflar; yine de acele adaletsizlikten iyidir.",
    source: "Yargı özdeyişi",
  },
  {
    text: "Delil yoksa iddia da yoktur.",
    source: "İspat yükü",
  },
  {
    text: "Hakim, davayı tarafların ileri sürdüğü vakıalarla bağlıdır.",
    source: "HMK ruhu",
  },
  {
    text: "Savunma, suçlamanın kardeşidir.",
    source: "Adil yargılanma",
  },
  {
    text: "Kanuna aykırı elde edilen delil, hükme esas alınamaz.",
    source: "Delil yasağı",
  },
  {
    text: "İyi niyet, hakkın kötüye kullanılmasını örtmez.",
    source: "TMK m.2",
  },
  {
    text: "Herkes, meşru vasıta ve yollardan faydalanarak yargı mercileri önünde davacı veya davalı olarak iddia ve savunma hakkına sahiptir.",
    source: "Anayasa m.36",
  },
  {
    text: "Kişinin onuru, dokunulmazdır.",
    source: "Anayasa m.17",
  },
  {
    text: "Süreler, hakkın sınırıdır; kaçırılan süre çoğu kez kaçırtılan haktır.",
    source: "Usul uyarısı",
  },
  {
    text: "Yorum, kanunun lafzını aşsa da amacını bozamaz.",
    source: "Yorum ilkesi",
  },
  {
    text: "Eşitler arasında ayrımcılık, eşitsizliktir.",
    source: "Eşitlik ilkesi",
  },
  {
    text: "Masumiyet karinesi, hüküm kesinleşene dek durur.",
    source: "Ceza muhakemesi",
  },
  {
    text: "Vekalet, güven işidir; yetki sınırını aşmak ihanete yakındır.",
    source: "Vekalet hukuku",
  },
  {
    text: "Sessizlik, her zaman kabul değildir.",
    source: "İrade beyanı",
  },
  {
    text: "Kamu düzeni, tarafların anlaşmasıyla ortadan kalkmaz.",
    source: "Emredici hükümler",
  },
  {
    text: "Zarar gören, zararını ispatla yükümlüdür.",
    source: "Tazminat hukuku",
  },
  {
    text: "Hâkim, hukuku resen uygular.",
    source: "HMK m.33",
  },
  {
    text: "Dürüstlük kuralı, bütün hakların üstündedir.",
    source: "TMK m.2",
  },
  {
    text: "Ceza, ancak kanunda yazılıysa vardır.",
    source: "Kanunilik",
  },
  {
    text: "Gerekçe yazılmayan karar, denetlenemez.",
    source: "Gerekçe hakkı",
  },
  {
    text: "Tanık, tarafın ağzı değil; gerçeğin kulağıdır.",
    source: "Delil değerlendirme",
  },
  {
    text: "Tecil edilen hak, unutulan hak olmasın.",
    source: "Takip disiplini",
  },
  {
    text: "Tebliğ edilmeyen işlem, çoğu kez yok hükmündedir.",
    source: "Tebliğ hukuku",
  },
  {
    text: "İhtiyati tedbir, asıl davanın gölgesi değil; hakkın kalkanıdır.",
    source: "Geçici hukuki koruma",
  },
  {
    text: "Avukatın kalemi, müvekkilin kılıcıdır; yanlış savrulursa kendi yaralar.",
    source: "Meslek etiği",
  },
  {
    text: "Dosya okunmadan duruşmaya çıkılmaz.",
    source: "Büro kuralı",
  },
]

export function quoteForDate(date = new Date()) {
  const key = istanbulDayKey(date)
  const [y, m, d] = key.split("-").map(Number)
  const index = Math.abs(y * 372 + m * 31 + d) % LEGAL_QUOTES.length
  const quote = LEGAL_QUOTES[index]
  return { ...quote, dayKey: key, index }
}
