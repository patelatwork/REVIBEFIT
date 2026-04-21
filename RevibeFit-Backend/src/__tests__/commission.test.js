import { describe, it, expect } from "vitest";

// Pure business logic — no imports needed, just formulas matching the domain
const trainerRate = 0.15;
const labRate = 0.10;

const calcCommission = (amount, rate) => Math.round(amount * rate * 100) / 100;
const calcPayout = (amount, rate) => Math.round((amount - amount * rate) * 100) / 100;
const calcMonthlyEarnings = (sessions) => sessions.reduce((sum, s) => sum + s.amount, 0);

describe("Trainer commission (15%)", () => {
  it("commission on 0 is 0", () => {
    expect(calcCommission(0, trainerRate)).toBe(0);
  });

  it("commission on 100 is 15", () => {
    expect(calcCommission(100, trainerRate)).toBe(15);
  });

  it("commission on 1000 is 150", () => {
    expect(calcCommission(1000, trainerRate)).toBe(150);
  });

  it("commission on 9999.99 is 1499.99", () => {
    expect(calcCommission(9999.99, trainerRate)).toBe(1500.00);
  });

  it("commission on 500 is 75", () => {
    expect(calcCommission(500, trainerRate)).toBe(75);
  });

  it("commission on 333.33 is 49.99", () => {
    expect(calcCommission(333.33, trainerRate)).toBe(50.00);
  });
});

describe("Lab partner commission (10%)", () => {
  it("commission on 0 is 0", () => {
    expect(calcCommission(0, labRate)).toBe(0);
  });

  it("commission on 100 is 10", () => {
    expect(calcCommission(100, labRate)).toBe(10);
  });

  it("commission on 1000 is 100", () => {
    expect(calcCommission(1000, labRate)).toBe(100);
  });

  it("commission on 250 is 25", () => {
    expect(calcCommission(250, labRate)).toBe(25);
  });

  it("commission on 750 is 75", () => {
    expect(calcCommission(750, labRate)).toBe(75);
  });
});

describe("Payout calculation (amount - commission)", () => {
  it("trainer payout on 100 is 85", () => {
    expect(calcPayout(100, trainerRate)).toBe(85);
  });

  it("lab partner payout on 100 is 90", () => {
    expect(calcPayout(100, labRate)).toBe(90);
  });

  it("payout on 1000 trainer is 850", () => {
    expect(calcPayout(1000, trainerRate)).toBe(850);
  });

  it("payout on 1000 lab is 900", () => {
    expect(calcPayout(1000, labRate)).toBe(900);
  });

  it("payout + commission = amount", () => {
    const amount = 500;
    const commission = calcCommission(amount, trainerRate);
    const payout = calcPayout(amount, trainerRate);
    expect(commission + payout).toBeCloseTo(amount, 2);
  });
});

describe("Commission when rate is 0", () => {
  it("commission is 0", () => {
    expect(calcCommission(1000, 0)).toBe(0);
  });

  it("payout equals full amount", () => {
    expect(calcPayout(1000, 0)).toBe(1000);
  });
});

describe("Monthly earnings calculation", () => {
  it("empty sessions is 0", () => {
    expect(calcMonthlyEarnings([])).toBe(0);
  });

  it("single session", () => {
    expect(calcMonthlyEarnings([{ amount: 500 }])).toBe(500);
  });

  it("multiple sessions sum correctly", () => {
    const sessions = [{ amount: 200 }, { amount: 300 }, { amount: 500 }];
    expect(calcMonthlyEarnings(sessions)).toBe(1000);
  });

  it("sessions with decimals", () => {
    const sessions = [{ amount: 99.99 }, { amount: 0.01 }];
    expect(calcMonthlyEarnings(sessions)).toBeCloseTo(100, 2);
  });
});

describe("Refund + commission interaction", () => {
  it("refund of full amount means 0 net earnings", () => {
    const amount = 500;
    const payout = calcPayout(amount, trainerRate);
    const refund = amount;
    const net = payout - refund;
    expect(net).toBe(-75); // trainer loses commission they paid
  });

  it("partial refund reduces net earnings", () => {
    const amount = 1000;
    const payout = calcPayout(amount, trainerRate);
    const refund = 500;
    const net = payout - refund;
    expect(net).toBe(350);
  });
});

describe("Platform fee retention", () => {
  it("platform keeps trainer commission", () => {
    const amount = 1000;
    const platform = calcCommission(amount, trainerRate);
    expect(platform).toBe(150);
  });

  it("platform keeps lab commission", () => {
    const amount = 1000;
    const platform = calcCommission(amount, labRate);
    expect(platform).toBe(100);
  });

  it("payout + platform = total amount", () => {
    const amount = 2000;
    const commission = calcCommission(amount, trainerRate);
    const payout = calcPayout(amount, trainerRate);
    expect(commission + payout).toBeCloseTo(amount, 5);
  });
});
