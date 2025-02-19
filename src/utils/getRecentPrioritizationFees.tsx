async function getAdaptivePriorityFee(connection: any, urgency: "low" | "medium" | "high") {
  const fees = await connection.getRecentPrioritizationFees();
  if (fees.length === 0) return 1000000;
  const sortedFees = fees.map((f: any) => f.prioritizationFee).sort((a: any, b: any) => a - b);
  let selectedFee = Number(sortedFees[sortedFees.length - 1]);
  if (urgency === "low") {
    selectedFee *= 0.34
    selectedFee += 250000
  } else if (urgency === "medium") {
    selectedFee *= 0.67
    selectedFee += 750000
  } else {
    selectedFee += 3000000
  }
  if (selectedFee > (20000000)) {
    selectedFee = 20000000
  }
  return Number(selectedFee.toFixed(0));
}

export default getAdaptivePriorityFee