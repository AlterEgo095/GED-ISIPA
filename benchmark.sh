#!/bin/bash
# GED-ISIPA Benchmark: PostgreSQL Performance Test
# Tests response times for key API operations

BASE_URL="https://ged.aenews.net"
ITERATIONS=10

echo "===== GED-ISIPA PostgreSQL Benchmark ====="
echo "Date: $(date)"
echo "Iterations per test: ${ITERATIONS}"
echo ""

# Test 1: Homepage load
echo "[1/6] Testing homepage response time..."
total=0
for i in $(seq 1 $ITERATIONS); do
    ms=$(curl -s -o /dev/null -w '%{time_total}' ${BASE_URL}/ 2>/dev/null)
    ms_ms=$(echo "$ms * 1000" | bc | cut -c1-6)
    total=$(echo "$total + $ms" | bc)
    echo "  Run $i: ${ms_ms}ms"
done
avg=$(echo "scale=2; $total / $ITERATIONS * 1000" | bc)
echo "  Average: ${avg}ms"
echo ""

# Test 2: Health API
echo "[2/6] Testing health API response time..."
total=0
for i in $(seq 1 $ITERATIONS); do
    ms=$(curl -s -o /dev/null -w '%{time_total}' ${BASE_URL}/api/health 2>/dev/null)
    ms_ms=$(echo "$ms * 1000" | bc | cut -c1-6)
    total=$(echo "$total + $ms" | bc)
    echo "  Run $i: ${ms_ms}ms"
done
avg=$(echo "scale=2; $total / $ITERATIONS * 1000" | bc)
echo "  Average: ${avg}ms"
echo ""

# Test 3: Login page
echo "[3/6] Testing login page response time..."
total=0
for i in $(seq 1 $ITERATIONS); do
    ms=$(curl -s -o /dev/null -w '%{time_total}' ${BASE_URL}/login 2>/dev/null)
    ms_ms=$(echo "$ms * 1000" | bc | cut -c1-6)
    total=$(echo "$total + $ms" | bc)
    echo "  Run $i: ${ms_ms}ms"
done
avg=$(echo "scale=2; $total / $ITERATIONS * 1000" | bc)
echo "  Average: ${avg}ms"
echo ""

# Test 4: Auth CSRF (lightweight DB hit)
echo "[4/6] Testing auth CSRF endpoint..."
total=0
for i in $(seq 1 $ITERATIONS); do
    ms=$(curl -s -o /dev/null -w '%{time_total}' ${BASE_URL}/api/auth/csrf 2>/dev/null)
    ms_ms=$(echo "$ms * 1000" | bc | cut -c1-6)
    total=$(echo "$total + $ms" | bc)
    echo "  Run $i: ${ms_ms}ms"
done
avg=$(echo "scale=2; $total / $ITERATIONS * 1000" | bc)
echo "  Average: ${avg}ms"
echo ""

# Test 5: PostgreSQL direct query speed
echo "[5/6] Testing PostgreSQL direct query speed..."
total=0
for i in $(seq 1 $ITERATIONS); do
    start=$(date +%s%N)
    sudo -u postgres psql -d ged_isipa -c 'SELECT COUNT(*) FROM "Document"' > /dev/null 2>&1
    end=$(date +%s%N)
    ms=$(echo "scale=2; ($end - $start) / 1000000" | bc)
    total=$(echo "$total + $ms" | bc)
    echo "  Run $i: ${ms}ms"
done
avg=$(echo "scale=2; $total / $ITERATIONS" | bc)
echo "  Average: ${avg}ms"
echo ""

# Test 6: Complex query
echo "[6/6] Testing complex dashboard query..."
total=0
for i in $(seq 1 $ITERATIONS); do
    start=$(date +%s%N)
    sudo -u postgres psql -d ged_isipa -c '
SELECT COUNT(*) FROM "Document" WHERE "isArchived" = false AND "isDeleted" = false;
SELECT COUNT(*) FROM "User" WHERE "isActive" = true;
SELECT COUNT(*) FROM "Document" GROUP BY status;
' > /dev/null 2>&1
    end=$(date +%s%N)
    ms=$(echo "scale=2; ($end - $start) / 1000000" | bc)
    total=$(echo "$total + $ms" | bc)
    echo "  Run $i: ${ms}ms"
done
avg=$(echo "scale=2; $total / $ITERATIONS" | bc)
echo "  Average: ${avg}ms"
echo ""

echo "===== Benchmark Complete ====="
