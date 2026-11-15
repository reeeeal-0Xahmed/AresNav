# مصادر ارتفاعات الخريطة الإقليمية

مصدر الارتفاعات هو منتج USGS المنشور Mars MGS MOLA - MEX HRSC Blended DEM Global 200m v2 [1]. جُلب جزء فعلي من GeoTIFF الأصلي [2]، ثم أعيد إسقاطه إلى شبكة كروية مترية خاصة بالمريخ بحجم خلية 200 م. لم تُستخدم بيانات عشوائية أو تنبؤ AI لتعبئة الخريطة.

تباعد البكسلات الاسمي 200 م لا يعني قياسًا مستقلاً بدقة 200 م في كل موضع. توثيق USGS يشرح مزج MOLA نحو 463 م مع HRSC نحو 50 م باستخدام interpolation، ويحذر من بعض مناطق المزج [1]. بيانات HRSC المستخدمة تغطي 44% من المريخ، والباقي ليس ارتفاعات HRSC بنفس التفاصيل. هذه نسخة تخطيط إقليمي لا اكتشاف صخور أو حفر بحجم الروفر.

الاستشهاد الموصى به: Fergason, R. L., Hare, T. M., & Laura, J. (2018). HRSC and MOLA Blended Digital Elevation Model at 200m v2. Astrogeology PDS Annex, U.S. Geological Survey [1]. صفحة المنتج تذكر MOLA CC0 وHRSC CC BY-SA 3.0 IGO؛ يجب الحفاظ على الإسناد ومراجعة التزامات الترخيص عند إعادة توزيع المشتقات [1].

نطاق الخريطة تحدده حدود e في آخر رابط Mars Trek من المستخدم [3]؛ منطقة 3 كم السابقة كانت قصًا مختلفًا داخل هذا العرض، وليست النطاق الكامل.

حدود العوائق والتكاليف الجديدة قواعد تجريبية للمشروع، لا حدود تشغيل معتمدة من NASA. تُطبَّق على الميل والانحراف عن متوسط 5 × 5 خلايا؛ ارتفاعات المريخ السالبة طبيعية وليست عائقًا لمجرد أنها تحت الصفر.

## References

[1]: https://astrogeology.usgs.gov/search/map/mars_mgs_mola_mex_hrsc_blended_dem_global_200m "USGS HRSC and MOLA Blended DEM v2 metadata, accuracy and licensing"
[2]: https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/Mars/HRSC_MOLA_Blend/Mars_HRSC_MOLA_BlendDEM_Global_200mp_v2.tif "USGS original HRSC MOLA elevation GeoTIFF"
[3]: https://trek.nasa.gov/mars/#v=0.1&x=77.42982155&y=18.46611095&z=9&p=urn%3Aogc%3Adef%3Acrs%3AEPSG%3A%3A104905&d=&locale=&b=mars&e=76.80291421306124%2C17.96348644765699%2C78.05672888693876%2C18.96873545234301&sfz=&w= "User-selected Mars Trek viewport"
