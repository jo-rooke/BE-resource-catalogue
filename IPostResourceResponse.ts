export default interface IPostResourceResponse {
  id: number;
  resource_name: string;
  author_name: string;
  url: string;
  description: string;
  content_type: string;
  week_no: number;
  recommender_id: number;
  rec_status: string;
  rec_message: string;
  tags: {
    id: number;
    name: string;
  }[];
}
