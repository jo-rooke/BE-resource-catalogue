INSERT INTO to_study_list (user_id, resource_id) values (6, 1);

INSERT INTO resources (resource_name,
author_name,
url,
description,
content_type,
week_no,
recommender_id,
rec_status,
rec_message)
values (
  'Test resource', 'Test author', 'https://test', 'Test description', 'article', 6, 6, 'I have not read this resource but it looks promising', 
  'HI test message'
  );