# Naskah video "Apa itu Motor Driver?" — dipakai oleh tts.py & render.py
SCENES = [
    ("hook",    "Pernah nyolok motor DC langsung ke Arduino, terus motornya nggak muter? Atau malah Arduino-nya rusak? Ini alasannya."),
    ("problem", "Pin Arduino cuma kuat ngasih arus sekitar dua puluh miliampere. Sementara motor DC butuh ratusan, bahkan ribuan miliampere. Kalau dipaksa, pinnya bisa jebol."),
    ("analogy", "Nah, di sinilah motor driver berperan. Arduino cukup kasih perintah kecil. Motor driver yang ngalirin listrik besar dari baterai ke motor. Ibaratnya, Arduino itu otak, motor driver itu ototnya."),
    ("hbridge", "Terus, gimana motor bisa maju dan mundur? Di dalamnya ada rangkaian H-Bridge, empat saklar yang disusun kayak huruf H. Arus lewat satu sisi, motor muter ke kanan. Dibalik, motor muter ke kiri."),
    ("pwm",     "Kalau mau ngatur kecepatan, pakai PWM. Listriknya dinyalain dan dimatiin super cepat. Makin lama nyalanya, makin kencang motornya."),
    ("examples","Contoh motor driver yang populer: L298N, L293D, dan TB6612FNG. Tinggal pilih sesuai besar motornya."),
    ("outro",   "Jadi ingat ya: Arduino itu otak, motor driver itu otot. Follow buat penjelasan elektronika simpel lainnya!"),
]
VOICE = "id-ID-ArdiNeural"
RATE = "+8%"
