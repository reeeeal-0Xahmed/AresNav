<?php
// Run: php test_donki.php
$from = date('Y-m-d', strtotime('-7 days'));
$to = date('Y-m-d');
$urls = [
    "https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR?startDate=$from&endDate=$to",
    "https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/FLR?startDate=$from&endDate=$to",
    "https://api.nasa.gov/DONKI/FLR?startDate=$from&endDate=$to&api_key=DEMO_KEY",
];
foreach ($urls as $u) {
    $ch = curl_init($u);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_HTTPHEADER => ['Accept: application/json'],
    ]);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    echo "URL:    $u\n";
    echo "STATUS: $code" . ($err ? "  ERROR: $err" : "") . "\n";
    echo "BODY:   " . substr(preg_replace('/\s+/', ' ', (string)$body), 0, 120) . "\n\n";
}
