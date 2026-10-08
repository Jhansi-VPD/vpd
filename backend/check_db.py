import asyncio
from app.core.database import AsyncSessionLocal
from app.models.employee import Employee
from app.models.user import User
from sqlalchemy import select

async def check():
    async with AsyncSessionLocal() as db:
        emps = (await db.execute(select(Employee))).scalars().all()
        print('Total employees in DB:', len(emps))
        for e in emps:
            print(f'Employee ID: {e.id}, code: {e.employee_code}, user_id: {e.user_id}, desig: {e.designation}')
        users = (await db.execute(select(User))).scalars().all()
        print('Total users in DB:', len(users))
        for u in users:
            print(f'User ID: {u.id}, name: {u.name}, email: {u.email}, role: {u.role}')

asyncio.run(check())
