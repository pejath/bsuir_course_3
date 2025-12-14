class UpdateUserRoleEnumValues < ActiveRecord::Migration[8.1]
  def up
    User.where(role: 0).update_all(role: 1)
    User.where(role: 1).update_all(role: 2)
    User.where(role: 2).update_all(role: 3)
  end

  def down
    User.where(role: 3).update_all(role: 2)
    User.where(role: 2).update_all(role: 1)
    User.where(role: 1).update_all(role: 0)
  end
end
