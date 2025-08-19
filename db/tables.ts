export const configTable = `
create table if not exists config_master(
    id int auto_increment primary key,
    data_key varchar(50) not null,
    value json not null,
    is_active bool default true,
    created_at timestamp default current_timestamp
);`;