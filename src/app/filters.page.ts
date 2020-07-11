import { Component } from '@angular/core';

function pop(array: any) {
  const index = array.indexOf(5);
  if (index > -1) {
    array.splice(index, 1);
  }
  return array;
}

@Component({
  selector: 'app-filters',
  templateUrl: './filters.page.html',
  styleUrls: ['./filters.page.scss'],
})


export class FiltersPage {
  items: any = [];
  input = document.querySelector("ion-input");
  chipGroup = document.querySelector(".ion-chip-group");
  rangeChange(event) {
    console.log(event.detail.value.lower, event.detail.value.upper);
  }
  selectChange(event) {
    console.log(event.detail.value);
  }
  filterSetter(event) {
    // commit to local db
  }
  ngOnInit() {

    this.input.addEventListener("keydown", function (event) {
      // Handle the enter - create a new chip
      if (event.key === "Enter" || event.keyCode === 13) {
        // Create the chip element
        const chipEl = document.createElement("ion-chip");
        chipEl.slot = "start";
        chipEl.outline = true;
        this.items.push(event.target.value);
        console.log(this.items);
        // Make the input value the label of the chip
        chipEl.innerHTML = `
       <ion-label>${event.target.value}</ion-label>
       <ion-icon name="close-circle"></ion-icon>
    `;

        // Listen for on click of the chip and remove it
        chipEl.addEventListener("click", function () {
          console.log(chipEl.childNodes[1].textContent);
          chipEl.parentNode.removeChild(chipEl);
        });

        // add the chip element to the main group
        // and set the input to empty
        if (event.target.value !== "") {
          chipGroup.insertBefore(chipEl, input);
          input.value = "";
        }
      }

      // Handle the backspace - delete a chip
      if (event.key === "Backspace" || event.keyCode === 8) {
        // only remove a chip if the value is empty
        if (event.target.value === '') {
          const chips = chipGroup.querySelectorAll('ion-chip');

          if (chips.length > 0) {
            const chip = chips[chips.length - 1];

            if (chip.outline === false) {
              chip.parentNode.removeChild(chip);
              console.log(chip.childNodes[1].textContent);
            } else {
              chip.outline = false;
            }
          }

        }
      }
    });

  }

}
