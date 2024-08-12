const { AbilityBuilder, Ability } = require("@casl/ability");

function defineAbilitiesFor(user) {
  const { can, cannot, build } = new AbilityBuilder(Ability);

  //admin can approve owners,books
  if (user.userType === "admin") {
    can("manage", "all");
  } else if (user.userType === "owner") {
    can("create", "Book");
    can("manage", "BookCopy", { ownerId: user.id });
    can("read", "Book", { "$copies.ownerId$": user.id });
    can("update", "Book", { "$copies.ownerId$": user.id });
    can("delete", "Book", { "$copies.ownerId$": user.id });
    can("read", "Rent", { ownerId: user.id });
  } else if (user.userType === "customer") {
    can("read", "Book");
  }

  return build();
}

module.exports = defineAbilitiesFor;

// import { AbilityBuilder, Ability } from '@casl/ability';

// const { can, cannot, build } = new AbilityBuilder(Ability);

// // Assuming `userId` and `isAdmin` are provided by your application logic
// const userId = 201; // Example user ID
// const isAdmin = false; // Example admin flag

// can('manage', 'BookCopy', { ownerId: userId });
// can('manage', 'Book', {});

// if (isAdmin) {
//   can('manage', 'BookCopy');
//   can('manage', 'Book');
// }

// const ability = build();
