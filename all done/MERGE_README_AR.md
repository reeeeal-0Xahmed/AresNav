# الدمج: AresNav + Jezero regional → باك إند واحد

الأساس هو مشروع Jezero (التضاريس الحقيقية + C++ + Laravel). اتضاف له من AresNav: الطبقات، الـ POIs، الصور، الطقس الفضائي، وربطهم كلهم بالمسار في **briefing**.

## الجديد

| الملف | الوظيفة |
|---|---|
| `app/Services/RouteBriefing.php` | يحسب لكل مسار: ميل (max/mean/p95)، صعود/هبوط، تكلفة التضاريس، وقت EVA، POIs قريبة، وحكم GO/CAUTION/NO-GO مع الأسباب |
| `app/Services/SpaceWeather.php` | DONKI كـ proxy للإشعاع. الفشل = `UNKNOWN` (مش SAFE)، والفشل مش بيتخزّن في الـ cache |
| `app/Http/Controllers/MarsContextController.php` | `/mars/layers` و`/mars/science/pois` و`/mars/space-weather` و`/mars/images` |
| `app/Http/Controllers/MarsRouteController.php` | اتعدّل: `POST /mars/routes` بيرجع `briefing` لكل path و`verdict` في الـ GeoJSON |
| `app/Models/SciencePoi.php` + migration + seeder | الـ POIs (الـ seeder بيفلتر بحدود الخريطة) |
| `app/Console/Commands/MarsCheckLayers.php` | `php artisan mars:check-layers` يختبر روابط الـ tiles |
| `config/mars.php`, `routes/mars.php` | اتدمجوا |
| `storage/.../elevations.json` | الارتفاعات (للميل والصعود) |

اتشال من AresNav: `/route/plan` (الـ grid من الفرونت + الـ fallback الوهمي)، جدول `navigation_routes`، و`POST /science/pois/sync` المفتوح (استبدله بالـ seeder).

## التركيب

```bash
# 1) انسخ laravel/* و native/ فوق مشروعك (ادمج config/mars.php و routes/mars.php لو موجودين)
# 2) في config/services.php أضف:
#    'nasa' => ['key' => env('NASA_API_KEY', 'DEMO_KEY')],
# 3) في .env ضع NASA_API_KEY (مفتاح مجاني من api.nasa.gov)، لأن DEMO_KEY بيتعمله rate-limit بسرعة
#    ولو DONKI فشل كل المسارات هتبقى CAUTION بسبب RADIATION_UNKNOWN

php artisan migrate
php artisan db:seed --class=SciencePoiSeeder
php artisan mars:check-layers     # لازم كل طبقة تطلع OK قبل الـ demo
```

## اختبارات اتشغّلت فعلاً (PHP 8.3)

```bash
php tests/briefing_unit.php        # 16 فحص: قيم محسوبة يدوياً + مسار Jezero حقيقي
php tests/space_weather_unit.php   # 7 فحوص منطق التصنيف
```

أرقام المسار الحقيقي (96.4 كم) طابقت حساب Python مستقل: max 4.87° / mean 1.28° / ascent 1002.4 م.

## لم يُختبر

- Laravel نفسه (مفيش vendor هنا): الـ controllers اتفحصت syntax فقط. شغّل `tests/backend_integration.php` الأصلي بعد النسخ.
- الـ seeder وروابط NASA/Trek (محتاجة اتصال من جهازك).
- طبقة `ctx_5m`: الاسم من موارد التحدي، لكن امتداد الملف (`.png`) تخمين.

## افتراضات (مش حدود NASA)

سرعة المشي 2 كم/س، ميزانية EVA 8 ساعات، حدود الميل 10°/20°. كلها في `config/mars.php` تحت `briefing`، وبتظهر في الـ API نفسه تحت `limitations` و`eva.basis`.
