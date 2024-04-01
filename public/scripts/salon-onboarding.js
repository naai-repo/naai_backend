let form = document.getElementById("salon-onboarding-form");
let submit_button = document.getElementById("submit-button");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  submit_button.classList.add("submitting");
  submit_button.innerText = "Submitting...";
  let data = new FormData(form);
  let obj = {};
  data.forEach((val, key) => (obj[key] = val));
  console.log(obj);
  let response = await fetch(
    "https://script.google.com/macros/s/AKfycbxgF_ZcVuDRlqjpXpAYC3Hc41Lm4XO4QYFVd1DeeuYXEOWArHc9dhOkTlhosciarab8-w/exec",
    {
      method: "POST",
      body: data,
    }
  );
  let message = await response.text();
  alert(message);
  submit_button.innerText = "Submit";
  submit_button.classList.remove("submitting");
  form.reset();
});
