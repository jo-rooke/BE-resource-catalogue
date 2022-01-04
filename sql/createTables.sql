DROP TABLE IF EXISTS tags, tag_names, feedback, to_study_list, users, resources

CREATE TABLE users (
  id serial PRIMARY KEY,
  name varchar(50) NOT NULL,
  is_faculty boolean DEFAULT false 
  )
  
CREATE TABLE resources (
  id serial PRIMARY KEY,
  resource_name varchar(255) NOT NULL,
  author_name varchar(50) NOT NULL,
  url varchar(255) NOT NULL,
  description text NOT NULL,
  content_type varchar(255) NOT NULL,
  week_no int NOT NULL,
  creation_date timestamp DEFAULT current_timestamp,
  recommender_id int NOT NULL,
  rec_status text NOT NULL,
  rec_message text NOT NULL,
  FOREIGN KEY (recommender_id) references users (id) 
  )
  
  CREATE TABLE to_study_list (
    id serial PRIMARY KEY,
    user_id int,
    resource_id int,
    FOREIGN KEY (user_id) references users (id), 
    FOREIGN KEY (resource_id) references resources (id) 
    )
 
 CREATE TABLE feedback (
    id serial PRIMARY KEY,
    user_id int,
    resource_id int,
   	liked boolean, 
   	comment text,
    FOREIGN KEY (user_id) references users (id), 
    FOREIGN KEY (resource_id) references resources (id) 
    )
    
CREATE TABLE tag_names (
    id serial PRIMARY KEY,
   	name varchar(50)
    )
    
CREATE TABLE tags (
   	resource_id int,
  	tag_id int,
  	PRIMARY KEY (resource_id, tag_id),
    FOREIGN KEY (resource_id) references resources (id),
  	FOREIGN KEY (tag_id) references tag_names (id)
    )