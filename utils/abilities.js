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
