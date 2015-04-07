## Helper Objects

> Limit the functions available to the user 
> Sanitize the commands going into postgresql

DataTypes
TableConstraints
QueryOperators
SelectOptions
Joins

## Methods

> Allow creation, modification, and deletion of tables, rows, and relationships 
> Allow data access to find and filter data
> Limit user access based on publish and subscribe 

createTable ( tableName, tableObject, relatedTable )
> createTable( 'students', { name: [ '$string', '$notnull' ], age: [ '$number' ]}, 'majors' );
*Creates new table with data types and field constraints
*Allows for one-to-one relationships via foreign key 
*Automatically creates the primary key 

createRelationship
> createRelationship ( 'students', 'teachers' );
*Used INSTEAD OF not in addition to the relatedTable option in createTable for many to many relationships 
*Allows for many-to-many relationships via helper table 
*Automatically creates the primary and foreign keys 
*If record in parent table is deleted, records in helper table are also deleted 

alterTable
dropTable
insert
select
update
delete
autoSelect

publish/subscribe? 