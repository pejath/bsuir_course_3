class CreateGuests < ActiveRecord::Migration[8.1]
  def change
    create_table :guests do |t|
      t.string :first_name
      t.string :last_name
      t.string :email
      t.string :phone
      t.string :passport_number
      t.date :date_of_birth
      t.string :country
      t.text :notes

      t.timestamps
    end
  end
end
