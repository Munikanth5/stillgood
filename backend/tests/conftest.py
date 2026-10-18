import pytest
from app.core.database import db

@pytest.fixture(autouse=True)
def reset_db_before_test():
    db.reset_to_demo()
    yield
    db.reset_to_demo()
