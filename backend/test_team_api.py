import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_create_and_join_team():
    # Create a team
    resp = client.post("/api/create_team", json={"team_name": "Testers", "user_name": "Alice"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"]
    team_id = data["team_id"]
    user_id = data["user_id"]

    # Join the team
    resp2 = client.post("/api/join_team", json={"team_id": team_id, "user_name": "Bob"})
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2["success"]
    assert data2["team_id"] == team_id

    # Get team members
    resp3 = client.get(f"/api/team/{team_id}/members")
    assert resp3.status_code == 200
    data3 = resp3.json()
    assert data3["team_name"] == "Testers"
    assert any(m["name"] == "Alice" for m in data3["members"])
    assert any(m["name"] == "Bob" for m in data3["members"])
