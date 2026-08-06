import enum


class Department(str, enum.Enum):
    COMPUTER_ENGINEERING = "컴퓨터공학과"
    AI_GAME_SOFTWARE = "AI게임소프트웨어학과"
    COMPUTER_SECURITY = "컴퓨터보안공학과"
    ELECTRONIC_ENGINEERING = "전자공학과"
    INFO_COMMUNICATION = "정보통신공학과"


class Role(str, enum.Enum):
    STUDENT = "STUDENT"
    ASSISTANT = "ASSISTANT"


class RentalStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
