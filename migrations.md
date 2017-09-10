# Migrations
This is a stop-gap until proper migrations are implemented at a later date

## 2017-08-31T21:56:57.010Z
```
alter table channels add column temporary_index int;
```

## 2017-09-10T15:04:03.305Z
```
create table static_commands (command varchar not null, return_text varchar not null, primary key (command));
```
