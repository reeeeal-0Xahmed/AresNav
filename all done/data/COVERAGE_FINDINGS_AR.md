# نطاق الخريطة الكامل وتغطية الارتفاعات

المطلوب هو كامل حدود e في آخر رابط Mars Trek الذي أرسله المستخدم، وليس مربع 3 كم حول مركز x/y، وليس كامل سطح المريخ. الحدود: غرب 76.80291421306124، جنوب 17.96348644765699، شرق 78.05672888693876، شمال 18.96873545234301.

باستخدام كرة المريخ بنصف قطر 3396190 م، العرض التقريبي عند منتصف النطاق 70.4927208623 كم والارتفاع 59.5858306884 كم. شبكة تخطيط بحجم خلية 5 م تحتاج تقريبًا 168031882 خلية؛ 20 م تحتاج 10504500؛ 100 م تحتاج 420180؛ 200 م تحتاج 105194. هذه تقديرات الأبعاد الأرضية؛ الإسقاط النهائي يحدد الأبعاد الفعلية.

نموذج HiRISE السابق بدقة 1 م مصدر خاص بمنطقة هبوط أصغر، ولا يغطي كامل هذا النطاق. لا يجوز تمديده بافتراض ارتفاعات أو عوائق.

فُحص GeoTIFF الرسمي الموسع M20_JezeroCrater_CTXDEM_20m: الدقة 20 م، الأبعاد 4456 × 5067، حدود الملف الجغرافية غرب 76.99743706146 وجنوب 17.58051991054475 وشرق 78.58256332408818 وشمال 19.29018700686615. حتى حدود الملف لا تشمل الشريط الغربي من نطاق المستخدم؛ حدود الملف ليست إثباتًا على وجود بيانات صالحة في كل بكسل داخله. metadata المؤكد محفوظ في ctx_source_metadata.json.

USGS يصف المنتج بأنه CTX DEM موسع ليشمل كامل الفوهة [1]، لكنه لا يساوي كل عرض رابط المستخدم. الملف وmetadata متاحان في فهرس CTX الرسمي [2]. ملف PDS4 metadata يؤكد حدود الملف ومرجع المريخ والدقة [3].

نموذج CTX TRN الأصلي المنشور في كتالوج USGS يغطي نطاقًا أصغر، longitude 77.1605..77.699 وlatitude 18.211..18.7212، بدقة 20 م [4].

يجب فصل دقة صورة الفرونت عن دقة الارتفاعات وشبكة التخطيط؛ تكبير صورة القمر الصناعي أو interpolating ارتفاعات خشنة لا ينتج بيانات عوائق دقيقة جديدة.

## References

[1]: https://www.usgs.gov/media/images/jezero-crater-0 "USGS Jezero Crater CTX DEM description"
[2]: https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/mars2020_trn/CTX/index.html "USGS official CTX product directory"
[3]: https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/mars2020_trn/CTX/ScienceInvestigationMaps_JPL/M20_JezeroCrater_CTXDEM_20m.xml "PDS4 metadata for extended Jezero CTX DEM"
[4]: https://astrogeology.usgs.gov/search/map/mars_2020_terrain_relative_navigation_ctx_dtm_mosaic "USGS original CTX TRN DTM metadata"

## بديل يغطي كامل النطاق

منتج USGS العالمي Mars MGS MOLA - MEX HRSC Blended DEM Global 200m v2 يغطي longitude -180..180 وlatitude -90..90، وتباعد بكسلاته الاسمي 200 م [5]. هذا ليس ضمانًا أن قياسًا مستقلاً بدقة 200 م موجود بكل موضع: المصدر يدمج MOLA الأصلي نحو 463 م مع HRSC نحو 50 م، وقد استخدم interpolation، وتغطية HRSC المستخدمة 44% من المريخ. يمكن استخدامه لارتفاعات ومسارات إقليمية، لا لاستنتاج كل صخرة أو حفرة بحجم الروفر. يجب إبلاغ المستخدم وتثبيت قبول فرق الدقة قبل تغيير معنى شبكة العوائق المحلية السابقة.

[5]: https://astrogeology.usgs.gov/search/map/mars_mgs_mola_mex_hrsc_blended_dem_global_200m "USGS MOLA HRSC global blended DEM v2 metadata and limitations"
