import enum


class Department(str, enum.Enum):
    # AI·SW융합학부
    AI_GAME_SOFTWARE = "AI게임소프트웨어학과"
    COMPUTER_ENGINEERING = "컴퓨터공학과"
    COMPUTER_SECURITY = "컴퓨터보안공학과"
    ELECTRONIC_ENGINEERING = "전자공학과"
    INFO_COMMUNICATION = "정보통신공학과"
    # 스마트시스템공학부
    MECHANICAL_ENGINEERING = "기계공학과"
    INDUSTRIAL_MANAGEMENT_ENGINEERING = "산업경영공학과"
    ELECTRICAL_ENGINEERING = "전기공학과"
    CIVIL_ENGINEERING = "토목공학과"
    GEOSPATIAL_INFO_ENGINEERING = "지적공간정보학과"
    DRONE_INFO_ENGINEERING = "드론정보공학과"
    # 경영·휴먼라이프학부
    BUSINESS_ADMINISTRATION = "경영학과"
    TAX_ACCOUNTING = "세무회계과"
    REAL_ESTATE_MANAGEMENT = "부동산경영과"
    SOCIAL_WELFARE = "사회복지과"
    PUBLIC_ADMIN_SERVICE = "공공행정서비스과"
    AVIATION_SERVICE = "항공서비스과"
    CHINESE_BUSINESS = "중국어비즈니스과"
    JAPANESE = "일본어과"
    CREATIVE_WRITING = "문예창작과"
    EARLY_CHILDHOOD_EDUCATION = "유아교육학과"
    YOUTH_EDUCATION_COUNSELING = "청소년교육상담과"
    # 예술·건강학부
    INDUSTRIAL_DESIGN = "산업디자인학과"
    FASHION_LIVING_DESIGN = "패션 · 리빙디자인과"
    COMMUNICATION_DESIGN = "커뮤니케이션디자인과"
    AI_MEDIA_DESIGN = "AI미디어디자인학과"
    SPORTS_SCIENCE = "사회체육과"
    BEAUTY_MANAGEMENT = "뷰티매니지먼트과"
    HEALTH_MEDICAL_INFO = "보건의료정보과"
    APPLIED_MUSIC = "실용음악과"
    THEATER_FILM = "연극영상학과"
    # 자유전공학부
    LIBERAL_ARTS = "자유전공학과"


class Role(str, enum.Enum):
    STUDENT = "STUDENT"
    ASSISTANT = "ASSISTANT"


class RentalStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    RETURNED = "RETURNED"
