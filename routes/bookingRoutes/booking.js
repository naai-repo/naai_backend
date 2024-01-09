
// select services
// total duration (window size)
// A B C artists, you need an array of their bookings 00100110, every bit represents the 30 min interval, 0 means booked, 1 means free
// you know the slot size for each service
// now checking for each permutation in a given window
// A 2, B 1, C 3
// lets check for permutation BAC
// you are checking for the window L to R
// is B empty for the range L to L + (serviceSIze(B) - 1)

// let request = [
//     {
//         service: {name: "haircut", time: "1"},
//         artist: "a"
//     },
//     {
//         service: {name: "spa", time: "2"} ,
//         artist: "b"
//     },
//     {
//         service: {name: "facial", time: "1"},
//         artist: "c"
//     }
// ];

// const permutations = arr => {
// if (arr.length <= 2) return arr.length === 2 ? [arr, [arr[1], arr[0]]] : arr;
// return arr.reduce(
// (acc, item, i) =>
//   acc.concat(
//     permutations([...arr.slice(0, i), ...arr.slice(i + 1)]).map(val => [
//       item,
//       ...val,
//     ])
//   ),
// []
// );
// };

// const windowSize = arr => {
// let size = 0;
// arr.map(ele => size += Number(ele.service.time))
// return size;
// }

// let freeTime = {
// "a" : [1,1,1,1,0,0,1,1],
// "b" : [0,0,1,1,0,0,1,1],
// "c" : [0,0,1,1,1,1,0,1]
// }

const bookingHelper = (perm, ws, freeTime) => {
let left=0, right = ws-1;
let ans = [];
while(right<ws){
    let start = left;
    let flag = true;
    perm.forEach(item => {
        let artist = item.artist;
        let time = item.service.avgTime;
        while(time--){
            if(!freeTime[artist][start++]){
                flag = false;
                break;
            }
        }
    })
    if(flag){
        let obj = {
            slot: [left, right],
        }
        ans.push(obj);
    }
    left++;
    right++;
}
return ans;
}

const bookingTimeSlots = (request, freeTime) => {
let perms = permutations(request);
let ws = windowSize(request);
perms.forEach(item => {
    let ans = bookingHelper(item, ws, freeTime);
    if(ans.length){
        console.log({ans: JSON.stringify(ans), perm: item})
    }else{
        console.log("Not Possible")
    }
})
}

bookingTimeSlots(request, freeTime);
