class RemoveAuthTokenFromUsers < ActiveRecord::Migration[8.1]
  def change
    remove_column :users, :auth_token, :string
  end
end
