from dataclasses import dataclass

from app.models.enums import Department


@dataclass(frozen=True)
class DepartmentInfo:
    id: int
    college: str
    department: Department


DEPARTMENTS: list[DepartmentInfo] = [
    DepartmentInfo(1, "AI·SW융합학부", Department.AI_GAME_SOFTWARE),
    DepartmentInfo(2, "AI·SW융합학부", Department.COMPUTER_ENGINEERING),
    DepartmentInfo(3, "AI·SW융합학부", Department.COMPUTER_SECURITY),
    DepartmentInfo(4, "AI·SW융합학부", Department.ELECTRONIC_ENGINEERING),
    DepartmentInfo(5, "AI·SW융합학부", Department.INFO_COMMUNICATION),
    DepartmentInfo(6, "스마트시스템공학부", Department.MECHANICAL_ENGINEERING),
    DepartmentInfo(7, "스마트시스템공학부", Department.INDUSTRIAL_MANAGEMENT_ENGINEERING),
    DepartmentInfo(8, "스마트시스템공학부", Department.ELECTRICAL_ENGINEERING),
    DepartmentInfo(9, "스마트시스템공학부", Department.CIVIL_ENGINEERING),
    DepartmentInfo(10, "스마트시스템공학부", Department.GEOSPATIAL_INFO_ENGINEERING),
    DepartmentInfo(11, "스마트시스템공학부", Department.DRONE_INFO_ENGINEERING),
    DepartmentInfo(12, "경영·휴먼라이프학부", Department.BUSINESS_ADMINISTRATION),
    DepartmentInfo(13, "경영·휴먼라이프학부", Department.TAX_ACCOUNTING),
    DepartmentInfo(14, "경영·휴먼라이프학부", Department.REAL_ESTATE_MANAGEMENT),
    DepartmentInfo(15, "경영·휴먼라이프학부", Department.SOCIAL_WELFARE),
    DepartmentInfo(16, "경영·휴먼라이프학부", Department.PUBLIC_ADMIN_SERVICE),
    DepartmentInfo(17, "경영·휴먼라이프학부", Department.AVIATION_SERVICE),
    DepartmentInfo(18, "경영·휴먼라이프학부", Department.CHINESE_BUSINESS),
    DepartmentInfo(19, "경영·휴먼라이프학부", Department.JAPANESE),
    DepartmentInfo(20, "경영·휴먼라이프학부", Department.CREATIVE_WRITING),
    DepartmentInfo(21, "경영·휴먼라이프학부", Department.EARLY_CHILDHOOD_EDUCATION),
    DepartmentInfo(22, "경영·휴먼라이프학부", Department.YOUTH_EDUCATION_COUNSELING),
    DepartmentInfo(23, "예술·건강학부", Department.INDUSTRIAL_DESIGN),
    DepartmentInfo(24, "예술·건강학부", Department.FASHION_LIVING_DESIGN),
    DepartmentInfo(25, "예술·건강학부", Department.COMMUNICATION_DESIGN),
    DepartmentInfo(26, "예술·건강학부", Department.AI_MEDIA_DESIGN),
    DepartmentInfo(27, "예술·건강학부", Department.SPORTS_SCIENCE),
    DepartmentInfo(28, "예술·건강학부", Department.BEAUTY_MANAGEMENT),
    DepartmentInfo(29, "예술·건강학부", Department.HEALTH_MEDICAL_INFO),
    DepartmentInfo(30, "예술·건강학부", Department.APPLIED_MUSIC),
    DepartmentInfo(31, "예술·건강학부", Department.THEATER_FILM),
    DepartmentInfo(32, "자유전공학부", Department.LIBERAL_ARTS),
]

DEPARTMENT_ID_BY_VALUE: dict[Department, int] = {info.department: info.id for info in DEPARTMENTS}
DEPARTMENT_BY_ID: dict[int, DepartmentInfo] = {info.id: info for info in DEPARTMENTS}


def department_id_of(department: Department) -> int:
    return DEPARTMENT_ID_BY_VALUE[department]


def department_by_id(department_id: int) -> Department | None:
    info = DEPARTMENT_BY_ID.get(department_id)
    return info.department if info else None
