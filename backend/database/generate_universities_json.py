import json
import re

nirf_raw = """
Indian Institute of Technology Madras|1
Indian Institute of Science|2
Indian Institute of Technology Bombay|3
Indian Institute of Technology Delhi|4
Indian Institute of Technology Kanpur|5
Indian Institute of Technology Kharagpur|6
Indian Institute of Technology Roorkee|7
All India Institute of Medical Sciences, Delhi|8
Jawaharlal Nehru University|9
Banaras Hindu University|10
Indian Institute of Technology Guwahati|11
Indian Institute of Technology Hyderabad|12
Jamia Millia Islamia|13
Manipal Academy of Higher Education-Manipal|14
University of Delhi|15
Birla Institute of Technology & Science -Pilani|16
Amrita Vishwa Vidyapeetham|17
Jadavpur University|18
Aligarh Muslim University|19
Homi Bhabha National Institute|20
Vellore Institute of Technology|21
S.R.M. Institute of Science and Technology|22
Saveetha Institute of Medical and Technical Sciences|23
Indian Agricultural Research Institute|24
Siksha `O` Anusandhan|25
University of Hyderabad|26
Indian Institute of Technology Indore|27
Kalinga Institute of Industrial Technology|27
Anna University|29
National Institute of Technology Tiruchirappalli|30
Indian Institute of Technology (Banaras Hindu University) Varanasi|31
Chandigarh University|32
Post Graduate Institute of Medical Education and Research|33
National Institute of Technology Rourkela|34
Indian Institute of Technology (Indian School of Mines)|35
Indian Institute of Technology Patna|36
Amity University|37
JSS Academy of Higher Education and Research|38
Indian Institute of Technology Gandhinagar|39
Symbiosis International|40
Andhra University, Visakhapatnam|41
Kerala University|42
Jawaharlal Institute of Post Graduate Medical Education & Research|43
Thapar Institute of Engineering and Technology (Deemed-to-be-university)|44
National Institute of Technology Calicut|45
Koneru Lakshmaiah Education Foundation University (K L College of Engineering)|46
Calcutta University|47
Kalasalingam Academy of Research and Education|48
Lovely Professional University|49
Cochin University of Science and Technology|50
Shanmugha Arts Science Technology & Research Academy|51
Gauhati University|52
Osmania University|53
National Institute of Technology Karnataka, Surathkal|54
Indian Institute of Science Education & Research Pune|55
Indian Institute of Technology Ropar|56
Panjab University|57
Indian Institute of Technology Mandi|58
University of Kashmir|59
National Institute of Mental Health & Neuro Sciences, Bangalore|60
Bharathidasan University|61
Delhi Technological University|62
National Institute of Technology Warangal|63
UPES|64
Institute of Chemical Technology|64
Indian Institute of Technology Jodhpur|66
Indian Institute of Science Education & Research Kolkata|67
University of Madras|68
Babasheb Bhimrao Ambedkar University|69
Indian Institute of Science Education & Research, Mohali|70
Dr. D. Y. Patil Vidyapeeth|71
Graphic Era University|72
Alagappa University|73
Jamia Hamdard|74
Indian Institute of Science Education & Research Bhopal|75
Bharathiar University|76
Malaviya National Institute of Technology|77
All India Institute of Medical Sciences Rishikesh|78
Mahatma Gandhi University, Kottayam|79
Indian Institute of Technology Bhubaneswar|80
Punjab Agricultural University|81
Sri Sivasubramaniya Nadar College of Engineering|82
King George`s Medical University|83
Datta Meghe Institute of Higher Education and Research|84
Shiv Nadar University|85
Visvesvaraya National Institute of Technology, Nagpur|86
University of Jammu|87
Tamil Nadu Agricultural University|88
International Institute of Information Technology Hyderabad|89
Bharath Institute of Higher Education & Research|90
Savitribai Phule Pune University|91
Mumbai University|92
Sathyabama Institute of Science and Technology|93
Sher-e-Kashmir University of Agricultural Science and Technology of Kashmir|94
SVKM`s Narsee Monjee Institute of Management Studies|95
Christ University|96
National Institute of Technology Silchar|97
Manipal University Jaipur|98
Madan Mohan Malaviya University of Technology|99
All India Institute of Medical Sciences Bhubaneswar|100
"""

cu_raw = """
Central Tribal University of Andhra Pradesh
Central University of Andhra Pradesh
National Sanskrit University
Rajiv Gandhi University
Assam University
Tezpur University
Central University of South Bihar
Mahatma Gandhi Central University
Nalanda University
Dr. Rajendra Prasad Central Agriculture University
Guru Ghasidas Vishwavidyalaya
Central Sanskrit University
Indira Gandhi National Open University
Jamia Millia Islamia
Jawaharlal Nehru University
Shri Lal Bahadur Shastri National Sanskrit University
South Asian University
University of Delhi
Central University of Gujarat
Gati Shakti Vishwavidyalaya
Central University of Haryana
Central University of Himachal Pradesh
Central University of Jammu
Central University of Kashmir
Central University of Jharkhand
Central University of Karnataka
Central University of Kerala
Sindhu Central University
Dr. Hari Singh Gour University
Indira Gandhi National Tribal University
Mahatma Gandhi Antarrashtriya Hindi Vishwavidyalaya
Central Agricultural University
Manipur University
National Sports University
North Eastern Hill University
Mizoram University
Nagaland University
Central University of Odisha
Pondicherry University
Central University of Punjab
Central University of Rajasthan
Sikkim University
Central University of Tamil Nadu
Indian Maritime University
English and Foreign Languages University
Maulana Azad National Urdu University
University of Hyderabad
Sammakka Sarakka Central Tribal University
Tripura University
Aligarh Muslim University
University of Allahabad
Babasaheb Bhimrao Ambedkar University
Banaras Hindu University
Rajiv Gandhi National Aviation University
Rani Lakshmi Bai Central Agricultural University
Hemwati Nandan Bahuguna Garhwal University
Visva-Bharati University
"""

inis_raw = """
Indian Institute of Technology, Jodhpur
Indian Institute of Technology, Tirupati
Indian Institute of Technology, Guwahati
Indian Institute of Technology, Patna
Indian Institute of Technology, Bhilai
Indian Institute of Technology, Delhi
Indian Institute of Technology, Goa
Indian Institute of Technology, Gandhinagar
Indian Institute of Technology, Mandi
Indian Institute of Technology, Jammu
Indian Institute of Technology (ISM), Dhanbad
Indian Institute of Technology, Dharwad
Indian Institute of Technology, Palakkad
Indian Institute of Technology, Indore
Indian Institute of Technology, Bombay
Indian Institute of Technology, Bhubaneswar
Indian Institute of Technology, Hyderabad
Indian Institute of Technology, Ropar
Indian Institute of Technology, Madras
Indian Institute of Technology, Kanpur
Indian Institute of Technology (BHU), Varanasi
Indian Institute of Technology, Roorkee
Indian Institute of Technology, Kharagpur
Indian Institute of Management, Ahmedabad
Indian Institute of Management, Amritsar
Indian Institute of Management, Bangalore
Indian Institute of Management, Bodh Gaya
Indian Institute of Management, Calcutta
Indian Institute of Management, Indore
Indian Institute of Management, Jammu
Indian Institute of Management, Kashipur
Indian Institute of Management, Kozhikode
Indian Institute of Management, Lucknow
Indian Institute of Management, Nagpur
Indian Institute of Management, Raipur
Indian Institute of Management, Ranchi
Indian Institute of Management, Rohtak
Indian Institute of Management, Sambalpur
Indian Institute of Management, Shilliong
Indian Institute of Management, Sirmaur
Indian Institute of Management, Tiruchirappalli
Indian Institute of Management, Udaipur
Indian Institute of Management, Visakhapatnam
Indian Institute of Management, Mumbai
Indian Institute of Management, Guwahati
Atal Bihari Vajpayee Indian Institute of Information Technology and Management, Gwalior
Indian Institute of Information Technology, Agartala
Indian Institute of Information Technology, Allahabad
Indian Institute of Information Technology, Bhagalpur
Indian Institute of Information Technology, Bhopal
Indian Institute of Information Technology, Design and Manufacturing, Jabalpur
Indian Institute of Information Technology, Design and Manufacturing, Kancheepuram
Indian Institute of Information Technology, Design and Manufacturing, Kurnool
Indian Institute of Information Technology, Dharwad
Indian Institute of Information Technology, Guwahati
Indian Institute of Information Technology, Kalyani
Indian Institute of Information Technology, Kota
Indian Institute of Information Technology, Kottayam
Indian Institute of Information Technology, Lucknow
Indian Institute of Information Technology, Manipur
Indian Institute of Information Technology, Nagpur
Indian Institute of Information Technology, Pune
Indian Institute of Information Technology, Raichur
Indian Institute of Information Technology, Ranchi
Indian Institute of Information Technology, Sonepat
Indian Institute of Information Technology, Sri City
Indian Institute of Information Technology, Surat
Indian Institute of Information Technology, Tiruchirappalli
Indian Institute of Information Technology, Una
Indian Institute of Information Technology, Vadodara
Indian Institute of Science Education and Research, Berhampur
Indian Institute of Science Education and Research, Bhopal
Indian Institute of Science Education and Research, Kolkata
Indian Institute of Science Education and Research, Mohali
Indian Institute of Science Education and Research, Pune
Indian Institute of Science Education and Research, Thiruvananthapuram
Indian Institute of Science Education and Research, Tirupati
All India Institute of Medical Sciences, Bathinda
All India Institute of Medical Sciences, Bhopal
All India Institute of Medical Sciences, Bhubaneswar
All India Institute of Medical Sciences, Bibinagar
All India Institute of Medical Sciences, Bilaspur
All India Institute of Medical Sciences, Deoghar
All India Institute of Medical Sciences, Gorakhpur
All India Institute of Medical Sciences, Guwahati
All India Institute of Medical Sciences, Jodhpur
All India Institute of Medical Sciences, Kalyani
All India Institute of Medical Sciences, Madurai
All India Institute of Medical Sciences, Mangalagiri
All India Institute of Medical Sciences, Nagpur
All India Institute of Medical Sciences, New Delhi
All India Institute of Medical Sciences, Patna
All India Institute of Medical Sciences, Raebareli
All India Institute of Medical Sciences, Raipur
All India Institute of Medical Sciences, Rajkot
All India Institute of Medical Sciences, Rishikesh
All India Institute of Medical Sciences, Vijaypur
National Institute of Technology, Raipur
National Institute of Technology, Rourkela
National Institute of Technology, Sikkim
National Institute of Technology, Silchar
National Institute of Technology, Srinagar
National Institute of Technology, Tiruchirappalli
National Institute of Technology, Uttarakhand
National Institute of Technology, Warangal
Dr. B. R. Ambedkar National Institute of Technology, Jalandhar
Malaviya National Institute of Technology, Jaipur
Maulana Azad National Institute of Technology, Bhopal
Motilal Nehru National Institute of Technology, Allahabad
National Institute of Technology, Agartala
National Institute of Technology, Andhra Pradesh
National Institute of Technology, Arunachal Pradesh
National Institute of Technology, Calicut
National Institute of Technology, Delhi
National Institute of Technology, Durgapur
National Institute of Technology, Goa
National Institute of Technology, Hamirpur
National Institute of Technology, Jamshedpur
National Institute of Technology, Karnataka
National Institute of Technology, Kurukshetra
National Institute of Technology, Manipur
National Institute of Technology, Meghalaya
National Institute of Technology, Mizoram
National Institute of Technology, Nagaland
National Institute of Technology, Patna
National Institute of Technology, Puducherry
Visvesvaraya National Institute of Technology, Nagpur
Sardar Vallabhbhai National Institute of Technology, Surat
National Institute of Design, Ahmedabad
National Institute of Design, Andhra Pradesh
National Institute of Design, Assam
National Institute of Design, Haryana
National Institute of Design, Madhya Pradesh
National Institute of Food Technology Entrepreneurship and Management, Sonepat
National Institute of Food Technology, Entrepreneurship and Management, Thanjavur
National Institute of Pharmaceutical Education and Research, Ahmedabad
National Institute of Pharmaceutical Education and Research, Guwahati
National Institute of Pharmaceutical Education and Research, Hajipur
National Institute of Pharmaceutical Education and Research, Hyderabad
National Institute of Pharmaceutical Education and Research, Kolkata
National Institute of Pharmaceutical Education and Research, Mohali
National Institute of Pharmaceutical Education and Research, Raebareli
School of Planning and Architecture, Bhopal
School of Planning and Architecture, New Delhi
School of Planning and Architecture, Vijayawada
Rashtriya Raksha University
Aligarh Muslim University
Banaras Hindu University
Nalanda University
Dr. Rajendra Prasad Central Agriculture University
National Forensic Sciences University
Visva-Bharati University
Rani Lakshmi Bai Central Agricultural University
University of Allahabad
University of Delhi
National Institute of Mental Health and Neurosciences
Postgraduate Institute of Medical Education and Research
Sree Chitra Tirunal Institute for Medical Sciences and Technology
Jawaharlal Institute of Postgraduate Medical Education and Research
Asiatic Society
Indian Institute of Engineering Science and Technology, Shibpur
Dakshina Bharat Hindi Prachar Sabha
Kalakshetra Foundation
Indian Statistical Institute
Academy of Scientific and Innovative Research
Footwear Design and Development Institute
India International Arbitration Centre
Rajiv Gandhi National Institute of Youth Development
Regional Centre for Biotechnology
Rajiv Gandhi Institute of Petroleum Technology
Tribhuvan Sahkari University
Indian Institute of Petroleum and Energy
Institute of Teaching and Research in Ayurveda, Jamnagar
"""

def clean_name(name):
    name = name.strip()
    name = re.sub(r'\s+', ' ', name)
    name = name.replace(' (ISM)', '')
    name = name.replace(' (BHU)', '')
    name = name.replace(' (Indian School of Mines)', '')
    name = name.replace(' (Banaras Hindu University)', '')
    if "All India Institute of Medical Sciences" in name:
        if "Delhi" in name or "New Delhi" in name:
            name = "All India Institute of Medical Sciences, New Delhi"
    name = name.replace(' -Pilani', ', Pilani')
    name = name.replace(' & Science -Pilani', ' of Science and Technology, Pilani')
    name = name.replace(' & Science, Pilani', ' of Science and Technology, Pilani')
    name = name.replace(' & ', ' and ')
    name = re.sub(r'\[note \d+\]', '', name)
    name = re.sub(r'\[N \d+\]', '', name)
    name = name.strip(', ')
    return name

# Parse inputs
nirf_lines = [l.strip() for l in nirf_raw.split('\n') if l.strip()]
nirf_dict = {}
for line in nirf_lines:
    parts = line.split('|')
    if len(parts) == 2:
        name = clean_name(parts[0])
        rank = int(parts[1])
        nirf_dict[name] = rank

cu_lines = [l.strip() for l in cu_raw.split('\n') if l.strip()]
cus = set([clean_name(l) for l in cu_lines])

ini_lines = [l.strip() for l in inis_raw.split('\n') if l.strip()]
inis = set([clean_name(l) for l in ini_lines])

# AMU, BHU, DU are INIs based on Seventh Schedule
constitution_inis = {"Aligarh Muslim University", "Banaras Hindu University", "University of Delhi"}
inis.update(constitution_inis)

# Build unified database
unified_db = {}
all_names = set(list(nirf_dict.keys()) + list(cus) + list(inis))

for name in all_names:
    is_ini = name in inis
    is_cu = name in cus
    rank = nirf_dict.get(name, 999)
    
    if is_ini:
        points = 10
        classification = "Tier-1 (Institute of National Importance)"
    elif is_cu:
        points = 7
        classification = "Central University"
    elif rank <= 50:
        points = 3
        classification = f"Other College (NIRF Rank {rank})"
    else:
        points = 0
        classification = f"Other College (NIRF Rank {rank})" if rank <= 100 else "Other College"
        
    unified_db[name] = {
        "points": points,
        "classification": classification,
        "rank": rank if rank <= 100 else None
    }

with open("c:/Users/Viraal/Desktop/HRForm/backend/database/universities.json", "w", encoding="utf-8") as f:
    json.dump(unified_db, f, indent=4)

print(f"Generated registry with {len(unified_db)} universities in backend/database/universities.json")
