class CreateAuthTokens < ActiveRecord::Migration[8.1]
  def change
    create_table :auth_tokens do |t|
      t.references :user, null: false, foreign_key: true
      t.string :token
      t.string :device_info
      t.datetime :expires_at
      t.datetime :last_used_at

      t.timestamps
    end
  end
end
